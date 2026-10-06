<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { playPop, playTap } from '../composables/useSfx'
import { useAppUpdate } from '../composables/useAppUpdate'
import { placeUpdateBubble } from '../updateBubble'

const props = defineProps<{
  anchor: HTMLElement | null
}>()

const { bubbleVisible, remoteVersion, behindNotes, extraBehindCount, dismissUpdateBubble, reloadToNewVersion } =
  useAppUpdate()

const box = ref({ top: 0, left: 0, width: 292 })
const cardEl = ref<HTMLElement | null>(null)

function place() {
  const height = cardEl.value?.offsetHeight ?? 0
  box.value = placeUpdateBubble(props.anchor, 292, height)
}

function onDismiss() {
  playTap()
  dismissUpdateBubble()
}

function onUpdate() {
  playPop()
  reloadToNewVersion()
}

watch([bubbleVisible, () => props.anchor], async () => {
  if (!bubbleVisible.value) return
  await nextTick()
  place()
})

watch(behindNotes, async () => {
  if (!bubbleVisible.value) return
  await nextTick()
  place()
})

onMounted(() => {
  window.addEventListener('resize', place)
  window.addEventListener('scroll', place, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="bubbleVisible"
      class="update-bubble"
      role="status"
      :style="{ top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px` }"
    >
      <article ref="cardEl" class="card">
        <button class="close" type="button" aria-label="关闭" @click="onDismiss">×</button>
        <p class="title">发现新版本 v{{ remoteVersion }}</p>
        <ul v-if="behindNotes.length" class="notes">
          <li v-for="(note, index) in behindNotes" :key="`${note.at}-${index}`">{{ note.title }}</li>
        </ul>
        <p v-if="extraBehindCount > 0" class="more">还有 {{ extraBehindCount }} 条更早的更新</p>
        <button class="go" type="button" @click="onUpdate">去更新</button>
      </article>
    </div>
  </Teleport>
</template>

<style scoped>
.update-bubble {
  position: fixed;
  z-index: 50;
  pointer-events: none;
}

.card {
  pointer-events: auto;
  position: relative;
  padding: 16px 18px 14px;
  border-radius: 22px;
  background: #fffdf6;
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.16);
  display: grid;
  gap: 8px;
}

.card::before {
  content: '';
  position: absolute;
  right: 18px;
  top: -8px;
  width: 16px;
  height: 16px;
  background: #fffdf6;
  transform: rotate(45deg);
  box-shadow: -3px -3px 0 rgba(45, 58, 74, 0.04);
}

.title {
  margin: 0 22px 0 0;
  font-size: 18px;
  font-weight: 750;
  line-height: 1.25;
  color: var(--ink);
}

.notes {
  margin: 0;
  padding: 0 0 0 18px;
  display: grid;
  gap: 4px;
  color: #3d5164;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}

.more {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}

.go {
  min-height: 44px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffc56d 0%, var(--btn) 100%);
  color: var(--btn-ink);
  font-size: 18px;
  font-weight: 750;
  box-shadow: 0 5px 0 #d97706;
}

.go:active {
  transform: translateY(2px);
}

.close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  box-shadow: 0 3px 0 rgba(45, 58, 74, 0.1);
}
</style>
