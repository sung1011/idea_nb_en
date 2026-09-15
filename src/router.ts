import { createRouter, createWebHashHistory } from 'vue-router'
import animalIslandView from './views/animalIslandView.vue'
import dayCompleteView from './views/dayCompleteView.vue'
import dragSortView from './views/dragSortView.vue'
import echoCaveView from './views/echoCaveView.vue'
import findSceneView from './views/findSceneView.vue'
import flashFlipView from './views/flashFlipView.vue'
import homeView from './views/homeView.vue'
import letterWorkshopView from './views/letterWorkshopView.vue'
import playGalleryView from './views/playGalleryView.vue'
import singAlongView from './views/singAlongView.vue'
import soundFishView from './views/soundFishView.vue'
import tapTargetView from './views/tapTargetView.vue'
import whackWordView from './views/whackWordView.vue'
import wordAtlasView from './views/wordAtlasView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/animal-island', name: 'animalIsland', component: animalIslandView },
    { path: '/letter-workshop', name: 'letterWorkshop', component: letterWorkshopView },
    { path: '/word-atlas', name: 'wordAtlas', component: wordAtlasView },
    { path: '/play-gallery', name: 'playGallery', component: playGalleryView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/tap-target', name: 'tapTarget', component: tapTargetView },
    { path: '/flash-flip', name: 'flashFlip', component: flashFlipView },
    { path: '/whack-word', name: 'whackWord', component: whackWordView },
    { path: '/drag-sort', name: 'dragSort', component: dragSortView },
    { path: '/sing-along', name: 'singAlong', component: singAlongView },
    { path: '/find-scene', name: 'findScene', component: findSceneView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
  ],
})
