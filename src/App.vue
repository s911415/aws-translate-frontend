<template>
    <div id="app">
        <div class="main-container translator-container">
            <nav>
                <md-button
                    v-if="this.$route.name === 'Home'"
                    class="md-primary" value="translate" @click="onOperationChanged('translate')"
                    :class="{
                        active: op === 'translate'
                    }"
                >
                    <md-icon>translate</md-icon>
                    Text
                </md-button>
            </nav>

            <router-view/>
        </div>

        <p>&nbsp;</p>
        <p>&nbsp;</p>
    </div>
</template>

<script>

export default {
    name: 'App',
    components: {},
    data() {
        return {
            op: 'translate',
        };
    },
    computed: {},
    watch: {},
    mounted() {
        this.checkCred();
    },
    methods: {
        checkCred() {
            if(this.$route.name === 'Auth') return;
            if (
                !localStorage['AWS_ACCESS_KEY_ID'] || !localStorage['AWS_SECRET_ACCESS_KEY'] ||
                !(window.AWS && window.AWS.config && !window.AWS.config.credentials)
            ) {
                this.$router.push({
                    name: 'Auth',
                });
            }
        },
    }
}
</script>
