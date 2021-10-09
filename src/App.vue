<template>
    <div id="app">
        <div class="translator-container">
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

                        <md-button class="md-icon-button" @click="swapLang">
                            <md-icon>swap_horiz</md-icon>
                        </md-button>

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
                    </div>

                    <div class="translator-io-wrapper">
                        <div class="translator-io">
                        <textarea class="translator-source-input" :value="text"
                                  @input="onTextInput"></textarea>
                            <span class="text-limit">{{ text.length }} / {{ limit.maxWord }}</span>
                        </div>
                        <div class="translator-io translator-target-output">{{ result }}</div>
                    </div>
                </md-card-content>
            </md-card>
        </div>
    </div>
</template>
<style>
body {
    margin: 0;
}

.translator-langs-header > .translator-lang-selector .md-button {
    font-size: 14px;
}

body .md-theme-default :not(input):not(textarea)::selection {
    background: #3297FD !important;
}
</style>

<style scoped type="text/scss">
#app {
    position: relative;
}

#app:before {
    background: #fafafa;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    content: '';
    display: block;
    height: 162px;
    overflow: hidden;
    width: 100%;
    z-index: -1;
    position: absolute;
    top: 0;
    left: 0;
}

.translator-container {
    margin: 0 auto;
    width: 1280px;
}

.translator-container nav {
    height: 68px;
    display: flex;
    align-items: center;
    margin-left: -8px;
    margin-right: -8px;
}

.translator-container nav button {
    border: 1px solid rgb(218, 220, 224);
}

.translator-container button.active {
    background-color: rgba(66, 133, 244, 0.12);
    border-color: rgb(218, 220, 224);
}

.translator-card-wrapper {
    border-radius: 8px;
    overflow: hidden;
}

.translator-card-wrapper > .md-card-content {
    padding: 0;
}

.translator-langs-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.translator-langs-header > .translator-lang-selector {
    flex: 1;
}

.translator-io-wrapper {
    display: flex;
}

.translator-io-wrapper input, .translator-io-wrapper textarea {
    display: block;
    outline: none;
    border: none;
    resize: none;
    width: 100%;
    font-size: inherit;
    line-height: inherit;
    font-family: inherit;
}

.translator-io-wrapper .translator-io {
    flex: 1;
    padding: 24px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
    word-wrap: break-word;
    font-size: 24px;
    line-height: 1.5;
    position: relative;
}

.translator-io-wrapper .translator-target-input {
    padding-right: 64px;
}

.translator-io-wrapper .text-limit {
    text-align: right;
    display: block;
    font-size: 12px;
}

.translator-io-wrapper .translator-target-output {
    border-left: 1px solid rgba(0, 0, 0, 0.12);
    background: rgb(245, 245, 245);
}
</style>

<script>
import TranslateClient from './aws/translate';

const DELAY = 500;
const TOP_3_SOURCE_KEY = 't3-src';
const TOP_3_TARGET_KEY = 't3-target';

export default {
    name: 'App',
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
            detectedLang: null,

            isUpdatingSourceLangNav: false,
            isUpdatingTargetLangNav: false,

            limit: {
                maxWord: 5000,
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
            this.updateRoute();
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
            this.updateRoute();
        },
        tl(value) {
            if (!this.top3TargetLang.includes(value)) {
                this.top3TargetLang = [value, ...this.top3TargetLang.slice(1)];
                this.saveTop3Lang();
            }
            if (this.$refs.langTargetTab.activeTab !== value) {
                this.$refs.langTargetTab.activeTab = value;
                this.triggerTargetNavUpdated();
            }
            this.updateTranslateResult();
            this.updateRoute();
        },
        text() {
            // TODO: check difference to replace or push
            let mode = 'replace';
            if (this.textChangeTimer) clearTimeout(this.textChangeTimer);
            this.textChangeTimer = setTimeout(() => {
                this.textChangeTimer = 0;
                this.updateTranslateResult();
                this.updateRoute(mode);
            }, DELAY);
        }
    },
    mounted() {
        window.app = this;
        this.initTop3Lang();
        TranslateClient.localizedLanguageNames(navigator.languages)
            .then(localizedLanguageNames => {
                this.localizedLanguageNames = localizedLanguageNames;
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
        },

        onTargetLangChanged(value) {
            if (!value) return;

            this.tl = value;
        },

        updateRoute(mode = 'replace') {
            let params = {
                name: 'Home',
                query: {
                    sl: this.sl,
                    tl: this.tl,
                    text: this.text,
                    op: this.op,
                },
            };

            let p = null;
            if (mode === 'replace') {
                p = this.$router.replace(params);
            } else if (mode === 'push') {
                p = this.$router.push(params);
            }

            if (p) {
                p.catch(e => {
                    if (e.name === 'NavigationDuplicated') return;
                    throw e;
                });
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
        },

        onTextInput(e) {
            this.text = e.target.value;
        },

        updateTranslateResult() {
            if(!this.text) return;
            TranslateClient.translateText(this.text, this.sl, this.tl)
                .then(r => {
                    if (this.sl === 'auto') {
                        this.detectedLang = r.SourceLanguageCode;
                    } else {
                        this.detectedLang = '';
                    }

                    this.result = r.TranslatedText;
                });
        },

        triggerSourceNavUpdated() {
            // due to framework not update nav when items update, use this hack
            this.$refs.langSourceTab.MdTabs = {...this.$refs.langSourceTab.MdTabs};
            this.isUpdatingSourceLangNav = true;
            this.$nextTick(() => {
                this.isUpdatingSourceLangNav = false;
                this.$nextTick(() => {
                    this.$refs.langSourceTab.MdTabs = {...this.$refs.langSourceTab.MdTabs};
                })
            });
        },

        triggerTargetNavUpdated() {
            this.isUpdatingTargetLangNav = true;
            this.$nextTick(() => {
                this.isUpdatingTargetLangNav = false;
                this.$refs.langTargetTab.MdTabs = {...this.$refs.langTargetTab.MdTabs};
            });
        },
    }
}
</script>
