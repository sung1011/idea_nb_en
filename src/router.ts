import { createRouter, createWebHashHistory } from 'vue-router'
import { noteNavigation } from './composables/usePwaUpdate'
import animalIslandView from './views/animalIslandView.vue'
import chapterFinaleView from './views/chapterFinaleView.vue'
import dayCompleteView from './views/dayCompleteView.vue'
import echoCaveView from './views/echoCaveView.vue'
import flashFlipView from './views/flashFlipView.vue'
import homeView from './views/homeView.vue'
import playGalleryView from './views/playGalleryView.vue'
import soundFishView from './views/soundFishView.vue'
import soundSpellView from './views/soundSpellView.vue'
import stickerAlbumView from './views/stickerAlbumView.vue'
import storyBookView from './views/storyBookView.vue'
import bubbleShotView from './views/bubbleShotView.vue'
import monsterFeedingView from './views/monsterFeedingView.vue'
import trainDeliveryView from './views/trainDeliveryView.vue'
import whackWordView from './views/whackWordView.vue'
import sentenceAtlasView from './views/sentenceAtlasView.vue'
import wordAtlasView from './views/wordAtlasView.vue'
import meadowView from './meadow/meadowView.vue'
import numberCountView from './views/numberCountView.vue'
import numberFlashView from './views/numberFlashView.vue'
import numberTapView from './views/numberTapView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: homeView },
    { path: '/animal-island', name: 'animalIsland', component: animalIslandView },
    { path: '/letter-workshop', redirect: '/' },
    { path: '/word-atlas', name: 'wordAtlas', component: wordAtlasView },
    { path: '/sentence-atlas', name: 'sentenceAtlas', component: sentenceAtlasView },
    { path: '/sticker-album', name: 'stickerAlbum', component: stickerAlbumView },
    { path: '/play-gallery', name: 'playGallery', component: playGalleryView },
    { path: '/sound-fish', name: 'soundFish', component: soundFishView },
    { path: '/echo-cave', name: 'echoCave', component: echoCaveView },
    { path: '/flash-flip', name: 'flashFlip', component: flashFlipView },
    { path: '/train-delivery', name: 'trainDelivery', component: trainDeliveryView },
    { path: '/monster-feeding', name: 'monsterFeeding', component: monsterFeedingView },
    { path: '/bubble-shot', name: 'bubbleShot', component: bubbleShotView },
    { path: '/whack-word', name: 'whackWord', component: whackWordView },
    { path: '/sound-spell', name: 'soundSpell', component: soundSpellView },
    { path: '/story-book', name: 'storyBook', component: storyBookView },
    { path: '/day-complete', name: 'dayComplete', component: dayCompleteView },
    { path: '/star-meadow', name: 'starMeadow', component: meadowView },
    { path: '/chapter-finale', name: 'chapterFinale', component: chapterFinaleView },
    { path: '/number-flash', name: 'numberFlash', component: numberFlashView },
    { path: '/number-tap', name: 'numberTap', component: numberTapView },
    { path: '/number-count', name: 'numberCount', component: numberCountView },
  ],
})

router.beforeEach((to) => {
  if (to.query.review === '1') return { path: '/' }
})

router.afterEach((to) => {
  noteNavigation(to.path)
})
