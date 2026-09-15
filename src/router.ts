import { createRouter, createWebHashHistory } from 'vue-router'
import homeView from './views/homeView.vue'
import soundFishView from './views/soundFishView.vue'
import wordMorphView from './views/wordMorphView.vue'
import echoCaveView from './views/echoCaveView.vue'
import dayCompleteView from './views/dayCompleteView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/word-morph', name: 'wordMorph', component: wordMorphView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
  ],
})
