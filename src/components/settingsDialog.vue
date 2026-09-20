<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { playPop } from '../composables/useSfx'
import { resetAllProgress } from '../composables/useProgress'
import bigButton from './bigButton.vue'

const open = defineModel<boolean>({ default: false })
const step = ref<'main' | 'confirm'>('main')
const router = useRouter()

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

watch(open, (value) => {
  if (value) {
    step.value = 'main'
    window.addEventListener('keydown', onKey)
    return
  }
  window.removeEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})

function close() {
  open.value = false
  step.value = 'main'
}

function askConfirm() {
  playPop()
  step.value = 'confirm'
}

function wipeAll() {
  playPop()
  resetAllProgress()
  close()
  void router.replace('/')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="settings-mask"
      @click.self="close"
    >
      <div
        class="settings-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <template v-if="step === 'main'">
          <p class="eyebrow">Settings</p>
          <h2 id="settings-title" class="title">设置</h2>
          <p class="warn">
            「初始化」会清空本地进度：星星、贴纸、图鉴解锁、章节关卡。词卡图片还在，不会删。
          </p>
          <big-button variant="danger" @click="askConfirm">初始化</big-button>
          <big-button variant="soft" @click="close">先不了</big-button>
        </template>
        <template v-else>
          <p class="eyebrow">Reset</p>
          <h2 id="settings-title" class="title">真的清空吗？</h2>
          <p class="warn">清空后不能找回，会回到第一次打开的样子。</p>
          <big-button variant="danger" @click="wipeAll">真的清空</big-button>
          <big-button variant="soft" @click="close">再想想</big-button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(14, 42, 58, 0.46);
}

.settings-card {
  width: min(100%, 360px);
  padding: 22px 18px 18px;
  border-radius: 28px;
  background: #fffdf6;
  box-shadow: 0 12px 0 rgba(45, 58, 74, 0.16);
  display: grid;
  gap: 10px;
}

.eyebrow {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.warn {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
  color: var(--ink);
}

</style>
