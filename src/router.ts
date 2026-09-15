import { createRouter, createWebHashHistory } from 'vue-router'
import animalIslandView from './views/animalIslandView.vue'
import blendBlocksView from './views/blendBlocksView.vue'
import dayCompleteView from './views/dayCompleteView.vue'
import dragSortView from './views/dragSortView.vue'
import echoCaveView from './views/echoCaveView.vue'
import findSceneView from './views/findSceneView.vue'
import homeView from './views/homeView.vue'
import letterWorkshopView from './views/letterWorkshopView.vue'
import onsetHuntView from './views/onsetHuntView.vue'
import playGalleryView from './views/playGalleryView.vue'
import singAlongView from './views/singAlongView.vue'
import soundFishView from './views/soundFishView.vue'
import tapTargetView from './views/tapTargetView.vue'
import wordMorphView from './views/wordMorphView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/animal-island', name: 'animalIsland', component: animalIslandView },
    { path: '/letter-workshop', name: 'letterWorkshop', component: letterWorkshopView },
    { path: '/play-gallery', name: 'playGallery', component: playGalleryView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/word-morph', name: 'wordMorph', component: wordMorphView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/tap-target', name: 'tapTarget', component: tapTargetView },
    { path: '/drag-sort', name: 'dragSort', component: dragSortView },
    { path: '/blend-blocks', name: 'blendBlocks', component: blendBlocksView },
    { path: '/onset-hunt', name: 'onsetHunt', component: onsetHuntView },
    { path: '/sing-along', name: 'singAlong', component: singAlongView },
    { path: '/find-scene', name: 'findScene', component: findSceneView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
  ],
})
