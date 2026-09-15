import { createRouter, createWebHashHistory } from 'vue-router'
import animalIslandView from './views/animalIslandView.vue'
import dayCompleteView from './views/dayCompleteView.vue'
import echoCaveView from './views/echoCaveView.vue'
import homeView from './views/homeView.vue'
import letterWorkshopView from './views/letterWorkshopView.vue'
import soundFishView from './views/soundFishView.vue'
import wordMorphView from './views/wordMorphView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/animal-island', name: 'animalIsland', component: animalIslandView },
    { path: '/letter-workshop', name: 'letterWorkshop', component: letterWorkshopView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/word-morph', name: 'wordMorph', component: wordMorphView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
  ],
})
