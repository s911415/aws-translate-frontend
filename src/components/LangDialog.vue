<template>
    <md-dialog :md-active.sync="mActive"
               @md-clicked-outside="onSelect(null)"
               @md-opened="onOpened"
               @md-closed="onClose"
               class="lang-dialog"
               :md-close-on-esc="true">
        <md-dialog-title>
            <md-field md-inline>
                <label>Search languages</label>
                <md-input v-model="filter" autofocus ref="filterInputBox" @input="updateFilteredLang"></md-input>
            </md-field>
            <md-divider class="hr"></md-divider>
        </md-dialog-title>
        <md-dialog-content>
            <div class="dummy"></div>
            <md-list v-if="filteredLang.length > 0" class="lang-list">
                <md-list-item
                    class="lang-item"
                    v-for="item in filteredLang"
                    @click="selectLang(item.code)"
                    :disabled="item.code === value"
                    :key="item.code"
                    :class="{'current': item.code === value}"
                >
                    <div class="lang-item-content">
                        <div class="checkbox">
                            <md-icon v-if="item.code === value">check</md-icon>
                        </div>
                        <div class="name">
                            {{ item.localizedName }} ({{ item.code }})
                        </div>
                    </div>
                </md-list-item>
            </md-list>
            <div class="no-result" v-else>
                No results
            </div>
        </md-dialog-content>
    </md-dialog>
</template>
<style scoped>
.hr {
    margin-left: -24px;
    margin-right: -24px;
}

.no-result {
    text-align: center;
    font-size: 24px;
    padding-top: 24px;
}

.lang-item.current *, .lang-item.current .md-icon-font {
    background-color: #e8f0fe;
    color: #185abc;
}

.dummy {
    width: 80vw;
    margin-left: -24px;
}
</style>
<script>
export default {
    name: 'LangDialog',
    props: {
        active: {
            type: Boolean,
            required: true,
        },
        availableLangList: {
            type: Array,
            required: true,
        },
        localizedLanguageNames: {
            type: Object,
            required: true,
        },
        value: {
            type: String,
            required: false,
        },
    },
    data() {
        return {
            mActive: false,
            filter: '',
            filteredLang: [],
            triggerSelect: false,
        };
    },
    created() {
        this.mActive = this.$props.active;
    },
    watch: {
        active(value) {
            this.mActive = value;
        },
        mActive(value) {
            this.$emit('update:active', value);
        },
        availableLangList() {
            this.updateFilteredLang();
        },
    },
    mounted() {
        this.updateFilteredLang();
    },
    methods: {
        onSelect(value) {
            this.$emit('select', value);
        },
        onClose() {
            if (this.triggerSelect) {
                this.triggerSelect = false;
            } else {
                this.onSelect(null);
            }
        },
        onOpened() {
            let el = this.$refs['filterInputBox'].$el;
            this.$nextTick(() => {
                setTimeout(() => {
                    el.focus();
                }, 50);
            });
        },

        selectLang(value) {
            this.triggerSelect = true;
            this.onSelect(value);
        },

        updateFilteredLang() {
            let codes = [];
            let filter = this.filter.toLowerCase().trim();
            if (filter !== '') {
                this.availableLangList.forEach(code => {
                    if (
                        code.toLowerCase().includes(filter) ||
                        this.localizedLanguageNames[code].toLowerCase().includes(filter)
                    ) {
                        codes.push(code);
                    }
                });
            } else {
                codes = [...this.availableLangList];
            }

            let result = [];
            codes.forEach(code => {
                if (code === 'auto') return;
                result.push({
                    code,
                    localizedName: this.localizedLanguageNames[code]
                });
            })

            result = result.sort((a, b) => a.localizedName.localeCompare(b.localizedName));
            this.filteredLang = result;
        },
    },
};
</script>