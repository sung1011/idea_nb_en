import { createRouter, createWebHashHistory } from 'vue-router'
import animalIslandView from './views/animalIslandView.vue'
import chapterFinaleView from './views/chapterFinaleView.vue'
import dayCompleteView from './views/dayCompleteView.vue'
import dragSortView from './views/dragSortView.vue'
import echoCaveView from './views/echoCaveView.vue'
import findSceneView from './views/findSceneView.vue'
import flashFlipView from './views/flashFlipView.vue'
import homeView from './views/homeView.vue'
import playGalleryView from './views/playGalleryView.vue'
import singAlongView from './views/singAlongView.vue'
import soundFishView from './views/soundFishView.vue'
import soundSpellView from './views/soundSpellView.vue'
import stickerAlbumView from './views/stickerAlbumView.vue'
import storyBookView from './views/storyBookView.vue'
import whackWordView from './views/whackWordView.vue'
import wordAtlasView from './views/wordAtlasView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/animal-island', name: 'animalIsland', component: animalIslandView },
    { path: '/letter-workshop', redirect: '/' },
    { path: '/word-atlas', name: 'wordAtlas', component: wordAtlasView },
    { path: '/sticker-album', name: 'stickerAlbum', component: stickerAlbumView },
    { path: '/play-gallery', name: 'playGallery', component: playGalleryView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/flash-flip', name: 'flashFlip', component: flashFlipView },
    { path: '/whack-word', name: 'whackWord', component: whackWordView },
    { path: '/drag-sort', name: 'dragSort', component: dragSortView },
    { path: '/sound-spell', name: 'soundSpell', component: soundSpellView },
    { path: '/story-book', name: 'storyBook', component: storyBookView },
    { path: '/sing-along', name: 'singAlong', component: singAlongView },
    { path: '/find-scene', name: 'findScene', component: findSceneView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
    { path: '/chapter-finale', name: 'chapterFinale', component: chapterFinaleView },
  ],
})

router.beforeEach((to) => {
  if (to.query.review === '1') return { path: '/' }
})
