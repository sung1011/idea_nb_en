<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'

export type AppSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type AppSelectGroup = {
  label: string
  options: AppSelectOption[]
}

type FlatOption = AppSelectOption & { index: number }

type SectionView = {
  label: string
  options: FlatOption[]
}

const props = withDefaults(
  defineProps<{
    options?: AppSelectOption[]
    groups?: AppSelectGroup[]
    placeholder?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    options: () => [],
    groups: () => [],
    placeholder: '请选择',
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ 'open-change': [open: boolean] }>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)
const panelStyle = ref<Record<string, string>>({})
const listId = useId()

const sections = computed<SectionView[]>(() => {
  const source = props.groups.length ? props.groups : [{ label: '', options: props.options }]
  const views: SectionView[] = []
  let index = 0
  for (const section of source) {
    const options = section.options.map((option) => {
      const row: FlatOption = { ...option, index }
      index += 1
      return row
    })
    views.push({ label: section.label, options })
  }
  return views
})

const flat = computed(() => sections.value.flatMap((section) => section.options))
const selected = computed(() => flat.value.find((option) => option.value === model.value))
const activeId = computed(() => (activeIndex.value >= 0 ? optionDomId(activeIndex.value) : undefined))

function optionDomId(index: number) {
  return `${listId}-opt-${index}`
}

function enabledIndex(from: number, step: number): number {
  const total = flat.value.length
  if (!total) return -1
  let index = from
  for (let hop = 0; hop < total; hop += 1) {
    index = (index + step + total) % total
    if (!flat.value[index]?.disabled) return index
  }
  return -1
}

function place() {
  const trigger = triggerRef.value
  if (!trigger || !open.value) return
  const rect = trigger.getBoundingClientRect()
  const gap = 8
  const margin = 8
  const spaceBelow = window.innerHeight - rect.bottom - gap - margin
  const spaceAbove = rect.top - gap - margin
  const openBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove
  const maxHeight = Math.max(88, Math.min(320, openBelow ? spaceBelow : spaceAbove))
  const width = Math.min(rect.width, window.innerWidth - margin * 2)
  let left = rect.left
  if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width
  if (left < margin) left = margin
  panelStyle.value = openBelow
    ? {
        top: `${rect.bottom + gap}px`,
        bottom: 'auto',
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      }
    : {
        top: 'auto',
        bottom: `${window.innerHeight - rect.top + gap}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      }
}

function scrollActiveIntoView() {
  const panel = panelRef.value
  const current = activeIndex.value >= 0 ? document.getElementById(optionDomId(activeIndex.value)) : null
  if (!panel || !current) return
  const panelRect = panel.getBoundingClientRect()
  const optionRect = current.getBoundingClientRect()
  if (optionRect.top < panelRect.top) panel.scrollTop -= panelRect.top - optionRect.top
  else if (optionRect.bottom > panelRect.bottom) panel.scrollTop += optionRect.bottom - panelRect.bottom
}

function bind() {
  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('resize', place)
  window.addEventListener('scroll', onScroll, true)
}

function unbind() {
  window.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('keydown', onKey, true)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', onScroll, true)
}

async function openPanel() {
  if (props.disabled || open.value) return
  const selectedIndex = flat.value.findIndex((option) => option.value === model.value && !option.disabled)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : flat.value.findIndex((option) => !option.disabled)
  open.value = true
  bind()
  await nextTick()
  place()
  scrollActiveIntoView()
  panelRef.value?.focus({ preventScroll: true })
}

function closePanel(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  unbind()
  if (restoreFocus) triggerRef.value?.focus({ preventScroll: true })
}

function toggle() {
  if (open.value) closePanel(false)
  else void openPanel()
}

function pick(option: FlatOption) {
  if (option.disabled) return
  model.value = option.value
  closePanel()
}

function move(step: number) {
  const next = enabledIndex(activeIndex.value, step)
  if (next < 0) return
  activeIndex.value = next
  void nextTick(() => scrollActiveIntoView())
}

function onKey(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closePanel()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    const first = flat.value.findIndex((option) => !option.disabled)
    if (first >= 0) {
      activeIndex.value = first
      void nextTick(() => scrollActiveIntoView())
    }
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    const last = enabledIndex(0, -1)
    if (last >= 0) {
      activeIndex.value = last
      void nextTick(() => scrollActiveIntoView())
    }
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const option = flat.value[activeIndex.value]
    if (option) pick(option)
    return
  }
  if (event.key === 'Tab') closePanel(false)
}

function onPointerDown(event: Event) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  closePanel(false)
}

function onScroll(event: Event) {
  const target = event.target
  if (target instanceof Node && panelRef.value?.contains(target)) return
  place()
}

function onTriggerKey(event: KeyboardEvent) {
  if (props.disabled || open.value) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void openPanel()
  }
}

function hover(option: FlatOption) {
  if (option.disabled) return
  activeIndex.value = option.index
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) closePanel(false)
  },
)

watch(open, (value) => emit('open-change', value))

onUnmounted(() => {
  if (!open.value) return
  open.value = false
  unbind()
  emit('open-change', false)
})
</script>

<template>
  <div class="app-select">
    <button
      :id="id"
      ref="triggerRef"
      class="trigger"
      :class="{ open, placeholder: !selected }"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <span class="trigger-label">{{ selected?.label ?? placeholder }}</span>
      <span class="chevron" aria-hidden="true" />
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        :id="listId"
        ref="panelRef"
        class="panel"
        role="listbox"
        tabindex="-1"
        :aria-activedescendant="activeId"
        :style="panelStyle"
        @mousedown.prevent
      >
        <div
          v-for="(section, sectionIndex) in sections"
          :key="`${section.label}-${sectionIndex}`"
          :role="section.label ? 'group' : undefined"
          :aria-label="section.label || undefined"
        >
          <p v-if="section.label" class="group-label" aria-hidden="true">{{ section.label }}</p>
          <div
            v-for="option in section.options"
            :id="optionDomId(option.index)"
            :key="option.index"
            class="option"
            :class="{
              selected: option.value === model,
              active: option.index === activeIndex,
              disabled: option.disabled,
            }"
            role="option"
            :aria-selected="option.value === model"
            :aria-disabled="option.disabled || undefined"
            @click="pick(option)"
            @pointerenter="hover(option)"
          >
            <span class="option-label">{{ option.label }}</span>
            <span v-if="option.value === model" class="check" aria-hidden="true">✓</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.app-select {
  width: 100%;
}

.trigger {
  width: 100%;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 18px;
  border: 2px solid #d5e2ea;
  background: #fff;
  color: var(--ink);
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.trigger:disabled {
  color: #a8b4c0;
  background: #f4f7f8;
}

.trigger.placeholder {
  color: var(--muted);
  font-weight: 650;
}

.trigger-label {
  min-width: 0;
}

.chevron {
  width: 10px;
  height: 10px;
  border-right: 3px solid currentColor;
  border-bottom: 3px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  flex: none;
}

.trigger.open .chevron {
  transform: translateY(2px) rotate(225deg);
}

.panel {
  position: fixed;
  z-index: 90;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 6px;
  border-radius: 20px;
  border: 2px solid #e4eef3;
  background: #fffdf6;
  box-shadow:
    0 10px 0 rgba(45, 58, 74, 0.12),
    0 18px 36px rgba(14, 42, 58, 0.16);
}

.group-label {
  margin: 8px 10px 2px;
  font-size: 13px;
  font-weight: 750;
  color: var(--muted);
}

.option {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  cursor: pointer;
}

.option.selected {
  background: #e5f6fb;
  color: #1d5c78;
}

.option.active {
  box-shadow: inset 0 0 0 2px #7ec8e3;
}

.option.disabled {
  color: #a8b4c0;
  background: transparent;
  cursor: default;
}

.option-label {
  min-width: 0;
}

.check {
  flex: none;
  font-size: 18px;
  font-weight: 800;
  color: #1d8aa8;
}
</style>
