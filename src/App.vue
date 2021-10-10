<template>
    <div id="app">
        <div class="main-container translator-container">
            <nav>
                <md-button
                    class="md-primary" value="'translate'" @click="onOperationChanged('translate')"
                    :class="{
                        active: op === 'translate'
                    }"
                >
                    <md-icon>translate</md-icon>
                    Text
                </md-button>
            </nav>

            <md-card class="translator-card-wrapper">
                <md-card-content>
                    <div class="translator-langs-header">
                        <div class="translator-lang-selector-container">
                            <md-tabs class="translator-lang-selector translator-source"
                                     @md-changed="onSourceLangChanged" ref="langSourceTab"
                                     @md-active-tab="sl"
                            >
                                <md-tab :md-label="autoLabel" id="auto"></md-tab>
                                <md-tab v-for="lang in top3SourceLang"
                                        :id="lang"
                                        :key="lang"
                                        :md-label="localizedLanguageNames[lang]"
                                        v-if="!isUpdatingSourceLangNav"
                                ></md-tab>
                            </md-tabs>
                            <md-button class="md-icon-button" @click="openSearchLang('source')">
                                <md-icon>more_horiz</md-icon>
                            </md-button>
                        </div>

                        <md-button class="md-icon-button" @click="swapLang">
                            <md-icon>swap_horiz</md-icon>
                        </md-button>

                        <div class="translator-lang-selector-container">
                            <md-tabs class="translator-lang-selector translator-target"
                                     @md-changed="onTargetLangChanged" ref="langTargetTab"
                                     @md-active-tab="tl"
                            >
                                <md-tab v-for="lang in top3TargetLang"
                                        v-if="!isUpdatingTargetLangNav"
                                        :id="lang"
                                        :key="lang"
                                        :md-label="localizedLanguageNames[lang]"></md-tab>
                            </md-tabs>
                            <md-button class="md-icon-button" @click="openSearchLang('target')">
                                <md-icon>more_horiz</md-icon>
                            </md-button>
                        </div>
                    </div>

                    <div class="translator-io-wrapper">
                        <div class="translator-io">
                            <md-button class="md-icon-button text-clear-btn" v-if="text.length > 0" @click="clearInput">
                                <md-icon>clear</md-icon>
                            </md-button>
                            <div class="translator-source-input-container">
                                <textarea class="translator-source-input" :value="text"
                                          :class="{'small-font': textRow > 3}"
                                          :style="{'min-height': textHeight}"
                                          rows="3"
                                          ref="input"
                                          autofocus
                                          @input="onTextInput"></textarea>
                                <textarea class="translator-source-input translator-source-input-shadow" :value="text"
                                          ref="input-shadow"
                                          :class="{'small-font': textRow > 3}"
                                          @input="onTextInput"></textarea>
                            </div>
                            <span class="text-limit">{{ text.length }} / {{ limit.maxWord }}</span>
                        </div>
                        <div
                            class="translator-io translator-target-output"
                            :class="{'small-font': textRow > 3}"
                        >{{ result }}
                        </div>
                    </div>
                </md-card-content>
            </md-card>
        </div>

        <lang-dialog
            :active.sync="selectLangDialog.show"
            :localized-language-names.sync="localizedLanguageNames"
            :available-lang-list.sync="selectLangDialog.availableLangList"
            :value.sync="selectLangDialog.value"
            @select="onLangSelected"
        />

        <p>&nbsp;</p>
        <p>&nbsp;</p>
    </div>
</template>

<script>
import TranslateClient from './aws/translate';
import LangDialog from './components/LangDialog';

const DELAY = 500;
const TOP_3_SOURCE_KEY = 't3-src';
const TOP_3_TARGET_KEY = 't3-target';

export default {
    name: 'App',
    components: {
        LangDialog,
    },
    data() {
        return {
            op: 'translate',
            sl: '',
            tl: '',
            text: '',
            result: '',
            textChangeTimer: 0,
            updateTranslateTimer: 0,
            top3SourceLang: [],
            top3TargetLang: [],
            localizedLanguageNames: {},
            supportedLanguagePairs: {},
            detectedLang: null,

            textRow: 3,
            textHeight: '0px',
            isUpdatingSourceLangNav: false,
            isUpdatingTargetLangNav: false,

            limit: {
                maxWord: 5000,
            },

            selectLangDialog: {
                value: null,
                show: false,
                availableLangList: [],
            },
        };
    },
    computed: {
        autoLabel() {
            let autoLabel = this.localizedLanguageNames['auto'] || 'Auto';
            if (this.sl === 'auto' && this.detectedLang) {
                autoLabel += ' (' + this.localizedLanguageNames[this.detectedLang] + ')';
            }

            return autoLabel;
        }
    },
    watch: {
        op() {
        },
        sl(value) {
            if (value !== 'auto' && !this.top3SourceLang.includes(value)) {
                this.top3SourceLang = [value, ...this.top3SourceLang.slice(1)];
                this.saveTop3Lang();
            }
            if (this.$refs.langSourceTab.activeTab !== value) {
                this.$refs.langSourceTab.activeTab = value;
                this.triggerSourceNavUpdated();
            }

            this.updateTranslateResult();
        },
        tl(value) {
            if (!this.top3TargetLang.includes(value)) {
                this.top3TargetLang = [value, ...this.top3TargetLang.slice(0, 2)];
                this.saveTop3Lang();
            }
            if (this.$refs.langTargetTab.activeTab !== value) {
                this.$refs.langTargetTab.activeTab = value;
                this.triggerTargetNavUpdated();
            }

            this.updateTranslateResult();
        },
        text() {
            let lines = this.text.split('\n').length;
            this.textRow = lines > 3 ? lines : 3;
            this.$nextTick(() => {
                this.textHeight = this.$refs["input-shadow"].scrollHeight + 'px';
            });

            // TODO: check difference to replace or push
            let mode = 'replace';
            if (this.textChangeTimer) clearTimeout(this.textChangeTimer);
            this.textChangeTimer = setTimeout(() => {
                this.textChangeTimer = 0;
                this.updateTranslateResult();
                this.updateRoute(mode);
            }, DELAY);
        },
        $route(to, from) {
            let keys = [
                'sl', 'tl', 'text', 'op'
            ];
            keys.forEach(k => {
                if (to.query[k] && to.query[k] !== this[k]) this[k] = to.query[k];
            });
        }
    },
    mounted() {
        window.app = this;
        this.initTop3Lang();
        TranslateClient.localizedLanguageNames(navigator.languages)
            .then(localizedLanguageNames => {
                this.localizedLanguageNames = localizedLanguageNames;
            });
        TranslateClient.listSupportedLanguagePairs()
            .then(supportedLanguagePairs => {
                this.supportedLanguagePairs = supportedLanguagePairs;
            });

        this.$nextTick(() => {
            if (this.$route.query.sl) {
                this.sl = this.$route.query.sl;
            } else {
                this.sl = 'auto';
            }
            if (this.$route.query.tl) {
                this.tl = this.$route.query.tl;
            } else {
                this.tl = 'zh-TW';
            }
            if (this.$route.query.text) {
                this.text = this.$route.query.text;
            }
            if (this.$route.query.op) {
                this.op = this.$route.query.op;
            }
        })
    },
    methods: {
        initTop3Lang() {
            let tmp;
            if (typeof (tmp = localStorage[TOP_3_SOURCE_KEY]) === 'string') {
                this.top3SourceLang = JSON.parse(tmp);
            } else {
                this.top3SourceLang = ['en', 'zh', 'zh-TW'];
            }
            if (typeof (tmp = localStorage[TOP_3_TARGET_KEY]) === 'string') {
                this.top3TargetLang = JSON.parse(tmp);
            } else {
                this.top3TargetLang = ['zh', 'en', 'zh-TW'];
            }
        },
        saveTop3Lang() {
            localStorage[TOP_3_SOURCE_KEY] = JSON.stringify(this.top3SourceLang);
            localStorage[TOP_3_TARGET_KEY] = JSON.stringify(this.top3TargetLang);
        },
        onOperationChanged(value) {
            // NOTHING
        },

        onSourceLangChanged(value) {
            if (!value) return;

            this.sl = value;
            this.updateRoute('push');
        },

        onTargetLangChanged(value) {
            if (!value) return;

            this.tl = value;
            this.updateRoute('push');
        },

        updateRoute(mode = 'replace') {
            this.$refs['input'].focus();
            let params = {
                name: 'Home',
                query: {
                    sl: this.sl,
                    tl: this.tl,
                    text: this.text,
                    op: this.op,
                },
            };

            // skip same route
            if (JSON.stringify(params.query) === JSON.stringify(this.$route.query)) {
                return;
            }

            let p = null;
            if (mode === 'replace') {
                p = this.$router.replace(params);
            } else if (mode === 'push') {
                p = this.$router.push(params);
            }
        },

        swapLang() {
            if (this.sl === 'auto') {
                this.sl = this.tl;
                this.tl = this.detectedLang;
            } else {
                let tmp = this.sl;
                this.sl = this.tl;
                this.tl = tmp;
            }
            this.text = this.result;
            this.updateRoute('push');
        },

        onTextInput(e) {
            let text = e.target.value;
            if (text.length > this.limit.maxWord) text = text.substr(0, this.limit.maxWord);
            this.text = text;
        },

        updateTranslateResult() {
            if (!this.text) {
                this.result = '';
                this.detectedLang = '';
                return;
            }
            TranslateClient.translateText(this.text, this.sl, this.tl)
                .then(r => {
                    if (this.sl === 'auto') {
                        this.detectedLang = r.SourceLanguageCode;
                    } else {
                        this.detectedLang = '';
                    }

                    this.result = r.TranslatedText;

                    this.$nextTick(() => {
                        this.$refs.langSourceTab.setIndicatorStyles();
                    });
                });
        },

        triggerSourceNavUpdated() {
            // due to framework not update nav when items update, use this hack
            this.$refs.langSourceTab.MdTabs = {...this.$refs.langSourceTab.MdTabs};
            this.isUpdatingSourceLangNav = true;
            this.$nextTick(() => {
                this.isUpdatingSourceLangNav = false;
                this.$refs.langSourceTab.setIndicatorStyles();
            });
        },

        triggerTargetNavUpdated() {
            this.isUpdatingTargetLangNav = true;
            this.$nextTick(() => {
                this.isUpdatingTargetLangNav = false;
                this.$refs.langTargetTab.setIndicatorStyles();
            });
        },

        clearInput() {
            this.text = '';
            this.result = '';
        },

        openSearchLang(type) {
            let currentLang, codes;
            if (type === 'source') {
                currentLang = this.sl;
                codes = Object.keys(this.supportedLanguagePairs);
            } else if (type === 'target') {
                currentLang = this.tl;
                codes = this.supportedLanguagePairs[this.sl];
            }

            this.selectLangDialog = {
                value: currentLang,
                type,
                availableLangList: codes,
                show: true,
            };
        },

        onLangSelected(value) {
            let type = this.selectLangDialog.type;
            this.selectLangDialog.show = false;
            if (value === null) return;

            if (type === 'source') {
                this.sl = value;
            } else if (type === 'target') {
                this.tl = value;
            }
        }
    }
}
</script>
