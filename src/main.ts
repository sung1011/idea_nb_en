import { GesturePlugin } from '@vueuse/gesture'
import { createApp } from 'vue'
import App from './App.vue'
import { startPwaUpdates } from './composables/usePwaUpdate'
import { router } from './router'
import './style.css'

createApp(App).use(router).use(GesturePlugin).mount('#app')
startPwaUpdates()
