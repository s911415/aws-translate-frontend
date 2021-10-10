<template>
    <md-empty-state>
        <form novalidate class="md-layout-item  md-size-100" @submit.prevent="checkAccessKey">
            <md-card class=" ">
                <md-card-header>
                    <div class="md-title">Authorization</div>
                </md-card-header>

                <md-card-content>
                    <md-field :class="getValidationClass('accessKeyId')">
                        <label for="accessKeyId">Access Key Id</label>
                        <md-input type="text" name="accessKeyId" id="accessKeyId" v-model="accessKeyId"
                                  ref="accessKeyIdInput"
                                  :disabled="sending" required/>

                        <span class="md-error" v-if="!$v.accessKeyId.required">Access Key Id is required</span>
                    </md-field>
                </md-card-content>

                <md-card-content>
                    <md-field :class="getValidationClass('secretAccessKey')">
                        <label for="secretAccessKey">Secret Access Key</label>
                        <md-input type="text" name="secretAccessKey" id="secretAccessKey" v-model="secretAccessKey"
                                  :disabled="sending" required/>

                        <span class="md-error" v-if="!$v.secretAccessKey.required">Secret Access Key is required</span>
                    </md-field>
                </md-card-content>

                <md-progress-bar md-mode="indeterminate" v-if="sending"/>

                <md-card-actions>
                    <md-button type="submit" class="md-primary" :disabled="sending">Login</md-button>
                </md-card-actions>
            </md-card>
        </form>
    </md-empty-state>
</template>
<script>
import {validationMixin} from 'vuelidate';

import {required,} from 'vuelidate/lib/validators';

export default {
    name: 'Auth',
    components: {},
    mixins: [validationMixin],
    data() {
        return {
            accessKeyId: '',
            secretAccessKey: '',
            sending: false,
        };
    },
    validations: {
        accessKeyId: {
            required,
        },
        secretAccessKey: {
            required,
        },
    },
    computed: {},
    watch: {},
    mounted() {
        let el = this.$refs.accessKeyIdInput.$el;
        this.$nextTick(() => {
            setTimeout(() => el.focus(), 50);
        });
    },
    methods: {
        getValidationClass(fieldName) {
            const field = this.$v[fieldName];

            if (field) {
                return {
                    'md-invalid': field.$invalid && field.$dirty,
                }
            }
        },
        checkAccessKey(e) {
            this.$v.$touch();

            if (!this.$v.$invalid) {
                AWS.config.credentials = {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                };
                this.sending = true;
                new AWS.Translate().translateText({
                    SourceLanguageCode: 'en',
                    TargetLanguageCode: 'en',
                    Text: 'AWS',
                }, (err, result) => {
                    this.sending = false;
                    if (err) {
                        alert(err.toString());
                        AWS.config.credentials = null;
                    } else {
                        localStorage['AWS_ACCESS_KEY_ID'] = this.accessKeyId;
                        localStorage['AWS_SECRET_ACCESS_KEY'] = this.secretAccessKey;
                        this.$router.replace({
                            name: 'Home',
                        });
                    }
                });
            }
        },
    }
}
</script>
