import Vue from 'vue';
import App from './App.vue';
import router from './router';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import './assets/fonts.css';
import './assets/style.css';

import {MdButton, MdCard, MdIcon, MdTabs, MdDialog, MdField, MdList, MdDivider} from 'vue-material/dist/components';

Vue.use(MdTabs);
Vue.use(MdButton);
Vue.use(MdIcon);
Vue.use(MdCard);
Vue.use(MdDialog);
Vue.use(MdField);
Vue.use(MdList);
Vue.use(MdDivider);

Vue.config.productionTip = false;

new Vue({
    router,
    render: h => h(App)
}).$mount('#app');
