import {
  accessoryAnchor,
  accessoryFile,
  HEART_GAIN_PET,
  HEART_GAIN_PLAY,
  heartFillPercent,
  animalById,
  BUBBLE_HOLD_MS,
  introLine,
  isFavoriteFood,
  meadowSrc,
  nextPlayLine,
  onFeed,
  onPlayTogether,
  pickMeadowBubble,
  yumLine,
  type MeadowBubbleItem,
  type MeadowAccessoryId,
  type MeadowAnimalId,
  type MeadowFoodId,
} from './meadowConfig'
import { playChomp, playGiggle, playHeartChime, playPetChirp, playSleepySigh } from './meadowAudio'
import { wordEmoji, wordImage } from '../data/phonicsFamily'

export type MeadowActorSeed = {
  id: MeadowAnimalId
  name: string
  x: number
  y: number
  hearts: number
  accessory: MeadowAccessoryId
}

export type MeadowSpot = {
  id: MeadowAnimalId
  x: number
  y: number
}

type Mode = 'idle' | 'walk' | 'sit' | 'look' | 'nap' | 'hop' | 'pet' | 'drag' | 'eat' | 'play' | 'dance'

type Actor = {
  id: MeadowAnimalId
  name: string
  el: HTMLDivElement
  body: HTMLDivElement
  shadow: HTMLElement
  x: number
  y: number
  px: number
  py: number
  /** 1 faces left (sprite default). -1 faces right. */
  face: 1 | -1
  mode: Mode
  nextThink: number
  poseUntil: number
  walkTx: number
  walkTy: number
  hopStart: number
  hopUntil: number
  introNext: boolean
  lean: number
  /** Recent successful bites. In memory only. Cleared when a full nap starts. */
  fedAt: number[]
  fullUntil: number
  eatStart: number
  eatUntil: number
  favoriteBite: boolean
  wiggleUntil: number
  pendingFull: boolean
  hearts: number
  accessory: MeadowAccessoryId
  acc: HTMLSpanElement | null
  lastHeartGainAt: number
  lastTapAt: number
  popUntil: number
  meter: HTMLElement | null
  bubbleEl: HTMLButtonElement | null
  bubbleTimer: number
  lastBubbleKey: string
}

type Session = {
  actor: Actor
  pointerId: number
  startX: number
  startY: number
  startT: number
  lastX: number
  lastY: number
  moved: number
  mode: 'pending' | 'pet' | 'drag'
  timer: number
  lastHeart: number
}

export type FeedMouth = { x: number; y: number }

export type FeedDrop =
  | { result: 'eaten'; animalId: MeadowAnimalId; favorite: boolean; mouth: FeedMouth }
  | { result: 'sleepy'; mouth: FeedMouth }
  | { result: 'miss' }

export type MeadowStage = {
  destroy: () => void
  setPaused: (paused: boolean) => void
  callToCenter: (id: string) => void
  upsert: (animal: MeadowActorSeed) => void
  hoverFood: (clientX: number, clientY: number) => void
  clearFoodHover: () => void
  dropFood: (foodId: MeadowFoodId, clientX: number, clientY: number) => FeedDrop
  noteHearts: (id: string, hearts: number, meter: boolean, chime: boolean) => void
  setAccessory: (id: string, accessory: MeadowAccessoryId) => void
}

const HOLD_MS = 350
const TAP_SLOP = 10

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * One animation frame drives every animal.
 * A treat drop calls `onFeed`. Dropping one animal onto another calls `onPlayTogether`.
 */
export function createMeadowStage(options: {
  field: HTMLElement
  animals: MeadowActorSeed[]
  onSpeak: (line: string, immediate?: boolean) => void
  onSave: (spots: MeadowSpot[]) => void
  onHeartGain?: (id: MeadowAnimalId, gain: number) => void
}): MeadowStage {
  const { field, onSpeak, onSave } = options
  const actors = new Map<string, Actor>()
  let fieldW = 1
  let fieldH = 1
  let sprite = 96
  let paused = false
  let dirty = false
  let lastSave = 0
  let lastUserAt = performance.now()
  let session: Session | null = null
  let raf = 0
  let lastFrame = performance.now()
  let foodHover: { x: number; y: number } | null = null
  const timers = new Set<number>()

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
    return id
  }

  const resize = new ResizeObserver(() => measure())

  function measure() {
    const rect = field.getBoundingClientRect()
    fieldW = Math.max(1, rect.width)
    fieldH = Math.max(1, rect.height)
    const short = Math.min(window.innerWidth, window.innerHeight)
    sprite = Math.round(clamp(short * 0.25, short * 0.22, short * 0.28))
    field.style.setProperty('--sprite', `${sprite}px`)
    for (const actor of actors.values()) pin(actor, actor.x, actor.y)
  }

  function playBounds() {
    let minY = Math.max(fieldH * 0.18, sprite * 0.7)
    const maxY = fieldH * 0.94
    if (minY > maxY - 12) minY = maxY * 0.5
    return {
      minX: fieldW * 0.1,
      maxX: fieldW * 0.9,
      minY,
      maxY,
    }
  }

  function pin(actor: Actor, xPercent: number, yPercent: number) {
    const box = playBounds()
    actor.px = clamp((xPercent / 100) * fieldW, box.minX, box.maxX)
    actor.py = clamp((yPercent / 100) * fieldH, box.minY, box.maxY)
    actor.x = clamp((actor.px / fieldW) * 100, 4, 96)
    actor.y = clamp((actor.py / fieldH) * 100, 4, 96)
  }

  function setFeet(actor: Actor, px: number, py: number) {
    const box = playBounds()
    actor.px = clamp(px, box.minX, box.maxX)
    actor.py = clamp(py, box.minY, box.maxY)
    actor.x = clamp((actor.px / fieldW) * 100, 4, 96)
    actor.y = clamp((actor.py / fieldH) * 100, 4, 96)
    dirty = true
  }

  function layout(actor: Actor) {
    actor.el.style.left = `${actor.px - sprite / 2}px`
    actor.el.style.top = `${actor.py - sprite}px`
    actor.el.style.zIndex = actor.mode === 'drag' ? '40' : actor.bubbleEl ? '36' : String(8 + Math.round(actor.y))
  }

  function paint(actor: Actor, now: number) {
    let bob = 0
    let sx = 1
    let sy = 1
    let rot = 0
    let lift = 0
    let shadow = 1
    let shadowOpacity = 0.32
    if (actor.mode === 'drag') {
      sx = 1.12
      sy = 1.12
      rot = Math.sin(now / 160) * 5
      lift = 18
      shadow = 1.65
      shadowOpacity = 0.2
    } else if (actor.mode === 'pet') {
      const wiggle = Math.sin(now / 70) * 7
      sx = 1.06
      sy = 0.92
      rot = actor.lean * 12 + wiggle
    } else if (actor.mode === 'nap') {
      sx = 1.1
      sy = 0.82
      if (now < actor.wiggleUntil) rot = Math.sin(now / 55) * 10
    } else if (actor.mode === 'eat') {
      const span = Math.max(1, actor.eatUntil - actor.eatStart)
      const p = clamp((now - actor.eatStart) / span, 0, 1)
      const wave = Math.abs(Math.sin(p * Math.PI * 3))
      sx = 1 + 0.14 * wave
      sy = 1 - 0.24 * wave
      if (actor.favoriteBite) {
        lift = Math.sin(p * Math.PI) * 20
        rot = Math.sin(p * Math.PI * 2) * 18
      }
    } else if (actor.mode === 'sit') {
      const wave = Math.sin(now / 280)
      sx = 1 - wave * 0.03
      sy = 1 + wave * 0.045
    } else if (actor.mode === 'look') {
      bob = Math.sin(now / 200) * 2
      rot = Math.sin(now / 220) * 4
    } else if (actor.mode === 'walk') {
      bob = Math.sin(now / 140) * 5
    } else if (actor.mode === 'dance') {
      const span = Math.max(1, actor.poseUntil - actor.hopStart)
      const p = clamp((now - actor.hopStart) / span, 0, 1)
      rot = p * 720
      lift = Math.sin(p * Math.PI * 2) * 12
      sx = 1.06
      sy = 1.06
    }
    if (now < actor.popUntil) {
      const k = 1 - (actor.popUntil - now) / 420
      const s = 1 + Math.sin(Math.min(1, Math.max(0, k)) * Math.PI) * 0.18
      sx *= s
      sy *= s
    }
    if (actor.mode === 'hop' || (actor.mode === 'walk' && now < actor.hopUntil)) {
      const span = Math.max(1, actor.hopUntil - actor.hopStart)
      const p = clamp((now - actor.hopStart) / span, 0, 1)
      if (p < 0.25) {
        const k = p / 0.25
        sx = 1 + 0.18 * k
        sy = 1 - 0.2 * k
      } else if (p < 0.65) {
        const k = (p - 0.25) / 0.4
        sx = 1.18 - 0.32 * k
        sy = 0.8 + 0.42 * k
        lift = Math.sin(k * Math.PI) * 26
      } else {
        const k = (p - 0.65) / 0.35
        sx = 0.86 + 0.14 * k
        sy = 1.22 - 0.22 * k
        lift = (1 - k) * 8
      }
    }
    actor.body.style.transform = `translateY(${bob - lift}px) rotate(${rot}deg) scale(${actor.face * sx}, ${sy})`
    actor.shadow.style.transform = `scale(${shadow}, ${shadow * 0.9})`
    actor.shadow.style.opacity = String(shadowOpacity)
    actor.el.classList.toggle('is-nap', actor.mode === 'nap')
    actor.el.classList.toggle('is-play', actor.mode === 'play')
    actor.el.classList.toggle('is-dance', actor.mode === 'dance')
    actor.el.classList.toggle('is-hidden', actor.mode === 'play')
    layout(actor)
  }

  function schedule(actor: Actor, now: number) {
    actor.nextThink = now + 2000 + Math.random() * 3000
  }

  function wake(actor: Actor, now: number) {
    lastUserAt = now
    if (actor.mode === 'nap') actor.mode = 'idle'
  }

  function think(actor: Actor, now: number) {
    const idleLong = now - lastUserAt > 20000
    if (idleLong && Math.random() < 0.45) {
      actor.mode = 'nap'
      actor.poseUntil = now + 4000 + Math.random() * 3000
      return
    }
    const roll = Math.random()
    if (roll < 0.45) {
      actor.mode = 'walk'
      actor.walkTx = 12 + Math.random() * 76
      actor.walkTy = 28 + Math.random() * 60
      actor.hopUntil = 0
      return
    }
    if (roll < 0.75) {
      actor.mode = 'sit'
      actor.poseUntil = now + 1600 + Math.random() * 1400
      return
    }
    actor.mode = 'look'
    actor.face = actor.face === 1 ? -1 : 1
    actor.poseUntil = now + 800 + Math.random() * 800
  }

  function hop(actor: Actor, now: number, ms: number) {
    actor.mode = 'hop'
    actor.hopStart = now
    actor.hopUntil = now + ms
  }

  function overlapTarget(actor: Actor): Actor | null {
    const ra = actor.el.getBoundingClientRect()
    let best: Actor | null = null
    let bestArea = 0
    for (const other of actors.values()) {
      if (other === actor || other.mode === 'play' || other.mode === 'drag') continue
      const rb = other.el.getBoundingClientRect()
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
      if (w <= 0 || h <= 0) continue
      const area = w * h
      if (area > bestArea) {
        best = other
        bestArea = area
      }
    }
    return best
  }

  function wakeJoin(actor: Actor, now: number) {
    actor.fullUntil = 0
    actor.pendingFull = false
    actor.wiggleUntil = 0
    actor.eatUntil = 0
    actor.favoriteBite = false
    lastUserAt = now
  }

  function buildCloud(a: Actor, b: Actor) {
    const cloud = document.createElement('div')
    cloud.className = 'meadow-cloud'
    cloud.style.left = `${(a.px + b.px) / 2}px`
    cloud.style.top = `${(a.py + b.py) / 2 - sprite * 0.42}px`
    const puffs = ['p1', 'p2', 'p3']
    for (const name of puffs) {
      const puff = document.createElement('i')
      puff.className = `puff ${name}`
      cloud.appendChild(puff)
    }
    for (const [actor, peekClass] of [
      [a, 'peek-a'],
      [b, 'peek-b'],
    ] as const) {
      const img = document.createElement('img')
      img.className = `peek ${peekClass}`
      img.alt = ''
      img.draggable = false
      img.src = meadowSrc(actor.id)
      cloud.appendChild(img)
    }
    for (const name of ['s1', 's2']) {
      const swirl = document.createElement('span')
      swirl.className = `swirl ${name}`
      cloud.appendChild(swirl)
    }
    for (const [name, glyph] of [
      ['t1', '✦'],
      ['t2', '★'],
      ['t3', '✦'],
    ] as const) {
      const star = document.createElement('span')
      star.className = `star ${name}`
      star.textContent = glyph
      cloud.appendChild(star)
    }
    field.appendChild(cloud)
    return cloud
  }

  function finishScuffle(a: Actor, b: Actor, cloud: HTMLElement) {
    cloud.remove()
    if (!a.el.isConnected || !b.el.isConnected) return
    const now = performance.now()
    const midX = (a.px + b.px) / 2
    const midY = (a.py + b.py) / 2
    setFeet(a, midX - sprite * 0.46, midY)
    setFeet(b, midX + sprite * 0.46, midY)
    if (a.px <= b.px) {
      a.face = -1
      b.face = 1
    } else {
      a.face = 1
      b.face = -1
    }
    for (const actor of [a, b]) {
      actor.mode = 'sit'
      actor.poseUntil = now + 1800
      actor.popUntil = now + 420
      spawnHeart(actor)
      paint(actor, now)
    }
    onSpeak(nextPlayLine())
    flush()
  }

  function startScuffle(a: Actor, b: Actor, now: number) {
    wakeJoin(a, now)
    wakeJoin(b, now)
    a.mode = 'play'
    b.mode = 'play'
    a.poseUntil = now + 2500
    b.poseUntil = now + 2500
    const cloud = buildCloud(a, b)
    paint(a, now)
    paint(b, now)
    playGiggle()
    later(() => playGiggle(), 900)
    onPlayTogether(a.id, b.id)
    options.onHeartGain?.(a.id, HEART_GAIN_PLAY)
    options.onHeartGain?.(b.id, HEART_GAIN_PLAY)
    later(() => finishScuffle(a, b, cloud), 2500)
  }

  function maybePetHeart(actor: Actor, now: number) {
    if (now - actor.lastHeartGainAt < 3000) return
    actor.lastHeartGainAt = now
    options.onHeartGain?.(actor.id, HEART_GAIN_PET)
  }

  function dance(actor: Actor, now: number) {
    actor.mode = 'dance'
    actor.face = 1
    actor.hopStart = now
    actor.poseUntil = now + 1100
    lastUserAt = now
    const glyphs = ['♪', '♫', '♩', '♫', '♪']
    glyphs.forEach((glyph, index) => {
      const note = document.createElement('span')
      note.className = 'meadow-note'
      note.textContent = glyph
      note.style.left = `${actor.px + (index - 2) * 16}px`
      note.style.top = `${actor.py - sprite * 0.82}px`
      note.style.animationDelay = `${index * 0.08}s`
      field.appendChild(note)
      note.addEventListener('animationend', () => note.remove())
    })
  }

  function showMeter(actor: Actor) {
    actor.meter?.remove()
    const row = document.createElement('div')
    row.className = 'meadow-meter'
    row.style.left = `${actor.px}px`
    row.style.top = `${actor.py - sprite - 6}px`
    for (let index = 0; index < 5; index += 1) {
      const bit = document.createElement('span')
      bit.className = 'bit'
      bit.textContent = '♥'
      const fill = document.createElement('i')
      fill.style.width = `${heartFillPercent(actor.hearts, index)}%`
      fill.textContent = '♥'
      bit.appendChild(fill)
      row.appendChild(bit)
    }
    field.appendChild(row)
    actor.meter = row
    later(() => {
      if (actor.meter === row) {
        row.remove()
        actor.meter = null
      }
    }, 2000)
  }

  function syncAccessory(actor: Actor, pop: boolean) {
    if (actor.accessory === 'none' || actor.hearts < 3) {
      actor.el.dataset.accessory = 'none'
      actor.acc?.remove()
      actor.acc = null
      return
    }
    const kind = actor.accessory
    actor.el.dataset.accessory = kind
    const anchor = accessoryAnchor(actor.id, kind)
    const file = accessoryFile(actor.accessory)
    if (!file) return
    if (!actor.acc) {
      const wrap = document.createElement('span')
      wrap.className = 'meadow-acc'
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      wrap.appendChild(img)
      actor.body.appendChild(wrap)
      actor.acc = wrap
    }
    const img = actor.acc.querySelector('img')
    if (img) img.src = meadowSrc(file)
    actor.acc.style.left = `${anchor.x}%`
    actor.acc.style.top = `${anchor.y}%`
    actor.acc.style.width = `${anchor.scale * 100}%`
    actor.acc.style.transform = `translate(-50%, -50%) rotate(${anchor.rot}deg)`
    if (pop && img) {
      img.classList.remove('is-pop')
      void img.offsetWidth
      img.classList.add('is-pop')
    }
  }

  function spawnHeart(actor: Actor) {
    if (!field.isConnected) return
    const heart = document.createElement('span')
    heart.className = 'meadow-heart'
    heart.textContent = '♥'
    heart.style.left = `${actor.px + (Math.random() - 0.5) * 36}px`
    heart.style.top = `${actor.py - sprite * 0.72}px`
    field.appendChild(heart)
    heart.addEventListener('animationend', () => heart.remove())
  }

  function dismissBubble(actor: Actor, animate: boolean) {
    window.clearTimeout(actor.bubbleTimer)
    actor.bubbleTimer = 0
    const el = actor.bubbleEl
    if (!el) return
    actor.bubbleEl = null
    if (!animate || !el.isConnected) {
      el.remove()
      return
    }
    el.classList.add('is-leaving')
    const done = () => el.remove()
    el.addEventListener('animationend', done, { once: true })
    window.setTimeout(done, 360)
  }

  function armBubble(actor: Actor) {
    window.clearTimeout(actor.bubbleTimer)
    actor.bubbleTimer = window.setTimeout(() => dismissBubble(actor, true), BUBBLE_HOLD_MS)
  }

  function bubbleFace(item: MeadowBubbleItem, host: HTMLButtonElement) {
    if (item.kind === 'sentence') {
      host.classList.add('is-sentence')
      const line = document.createElement('p')
      line.textContent = item.text
      host.append(line)
      return
    }
    if (item.numeral != null) {
      const numeral = document.createElement('span')
      numeral.className = 'meadow-bubble-num'
      if (item.numeral >= 100) numeral.classList.add('wide')
      numeral.textContent = String(item.numeral)
      host.append(numeral)
    } else {
      const src = wordImage(item.label)
      if (src) {
        const img = document.createElement('img')
        img.className = 'meadow-bubble-card'
        img.alt = ''
        img.draggable = false
        img.src = src
        img.addEventListener('error', () => {
          const emoji = document.createElement('span')
          emoji.className = 'meadow-bubble-emoji'
          emoji.textContent = wordEmoji(item.label)
          img.replaceWith(emoji)
        })
        host.append(img)
      } else {
        const emoji = document.createElement('span')
        emoji.className = 'meadow-bubble-emoji'
        emoji.textContent = wordEmoji(item.label)
        host.append(emoji)
      }
    }
    const label = document.createElement('b')
    label.textContent = item.label
    host.append(label)
  }

  function showBubble(actor: Actor, item: MeadowBubbleItem) {
    dismissBubble(actor, false)
    const host = document.createElement('button')
    host.type = 'button'
    host.className = 'meadow-bubble'
    host.setAttribute('aria-label', item.speak)
    bubbleFace(item, host)
    host.addEventListener('pointerdown', (event) => {
      event.stopPropagation()
      event.preventDefault()
    })
    host.addEventListener('pointerup', (event) => {
      event.stopPropagation()
      event.preventDefault()
      onSpeak(item.speak, true)
      armBubble(actor)
    })
    actor.el.append(host)
    actor.bubbleEl = host
    actor.lastBubbleKey = item.key
    armBubble(actor)
  }

  function tap(actor: Actor, now: number) {
    if (actor.hearts >= 5 && actor.lastTapAt > 0 && now - actor.lastTapAt < 450) {
      actor.lastTapAt = 0
      dance(actor, now)
      return
    }
    actor.lastTapAt = now
    wake(actor, now)
    hop(actor, now, 450)
    const chapterId = animalById(actor.id)?.chapterId
    const bubble = chapterId ? pickMeadowBubble(chapterId, actor.lastBubbleKey) : null
    if (bubble) {
      showBubble(actor, bubble)
      onSpeak(bubble.speak, true)
      return
    }
    const line = actor.introNext ? introLine(actor.name) : actor.name
    actor.introNext = !actor.introNext
    onSpeak(line)
  }

  function beginPet(now: number) {
    if (!session || session.mode !== 'pending') return
    window.clearTimeout(session.timer)
    session.mode = 'pet'
    session.actor.mode = 'pet'
    wake(session.actor, now)
    spawnHeart(session.actor)
    session.lastHeart = now
    playPetChirp()
    maybePetHeart(session.actor, now)
  }

  function beginDrag(now: number) {
    if (!session || session.mode !== 'pending') return
    if (session.moved > TAP_SLOP) {
      beginPet(now)
      return
    }
    session.mode = 'drag'
    session.actor.mode = 'drag'
    wake(session.actor, now)
  }

  function endSession(ev: PointerEvent) {
    if (!session || session.pointerId !== ev.pointerId) return
    window.clearTimeout(session.timer)
    const now = performance.now()
    const actor = session.actor
    const moved = Math.hypot(ev.clientX - session.startX, ev.clientY - session.startY)
    if (session.mode === 'pending' && now - session.startT < HOLD_MS && moved < TAP_SLOP) {
      tap(actor, now)
    } else if (session.mode === 'pet') {
      actor.mode = 'idle'
      schedule(actor, now)
    } else if (session.mode === 'drag') {
      const other = overlapTarget(actor)
      if (other) startScuffle(actor, other, now)
      else {
        hop(actor, now, 320)
        flush()
      }
    }
    if (actor.el.hasPointerCapture(ev.pointerId)) actor.el.releasePointerCapture(ev.pointerId)
    session = null
  }

  function onPointerDown(actor: Actor, ev: PointerEvent) {
    if (session || ev.button !== 0 || actor.mode === 'play') return
    ev.preventDefault()
    actor.el.setPointerCapture(ev.pointerId)
    const now = performance.now()
    session = {
      actor,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      startT: now,
      lastX: ev.clientX,
      lastY: ev.clientY,
      moved: 0,
      mode: 'pending',
      timer: window.setTimeout(() => beginDrag(performance.now()), HOLD_MS),
      lastHeart: 0,
    }
  }

  function onPointerMove(ev: PointerEvent) {
    if (!session || session.pointerId !== ev.pointerId) return
    const actor = session.actor
    session.moved = Math.hypot(ev.clientX - session.startX, ev.clientY - session.startY)
    const now = performance.now()
    if (session.mode === 'pending' && session.moved > TAP_SLOP) beginPet(now)
    if (session.mode === 'pet') {
      const rect = field.getBoundingClientRect()
      actor.lean = ev.clientX >= rect.left + actor.px ? 1 : -1
      const step = Math.hypot(ev.clientX - session.lastX, ev.clientY - session.lastY)
      session.lastX = ev.clientX
      session.lastY = ev.clientY
      if (step > 2) {
        playPetChirp()
        maybePetHeart(actor, now)
        if (now - session.lastHeart > 280) {
          spawnHeart(actor)
          session.lastHeart = now
        }
      }
      return
    }
    if (session.mode === 'drag') {
      const rect = field.getBoundingClientRect()
      setFeet(actor, ev.clientX - rect.left, ev.clientY - rect.top + sprite * 0.28)
    }
  }

  function add(seed: MeadowActorSeed, index: number) {
    const el = document.createElement('div')
    el.className = 'meadow-actor'
    el.dataset.id = seed.id
    const zzz = document.createElement('span')
    zzz.className = 'meadow-zzz'
    zzz.textContent = 'z z'
    const body = document.createElement('div')
    body.className = 'meadow-body'
    const shadow = document.createElement('i')
    shadow.className = 'meadow-shadow'
    const img = document.createElement('img')
    img.className = 'meadow-sprite'
    img.alt = seed.name
    img.draggable = false
    img.src = meadowSrc(seed.id)
    body.append(shadow, img)
    el.append(zzz, body)
    field.appendChild(el)
    const actor: Actor = {
      id: seed.id,
      name: seed.name,
      el,
      body,
      shadow,
      x: seed.x,
      y: seed.y,
      px: 0,
      py: 0,
      face: 1,
      mode: 'idle',
      nextThink: performance.now() + 500 + index * 280 + Math.random() * 1200,
      poseUntil: 0,
      walkTx: seed.x,
      walkTy: seed.y,
      hopStart: 0,
      hopUntil: 0,
      introNext: true,
      lean: 1,
      fedAt: [],
      fullUntil: 0,
      eatStart: 0,
      eatUntil: 0,
      favoriteBite: false,
      wiggleUntil: 0,
      pendingFull: false,
      hearts: seed.hearts,
      accessory: seed.accessory,
      acc: null,
      lastHeartGainAt: Number.NEGATIVE_INFINITY,
      lastTapAt: 0,
      popUntil: 0,
      meter: null,
      bubbleEl: null,
      bubbleTimer: 0,
      lastBubbleKey: '',
    }
    actor.el.dataset.hearts = String(seed.hearts)
    syncAccessory(actor, false)
    pin(actor, seed.x, seed.y)
    el.addEventListener('pointerdown', (ev) => onPointerDown(actor, ev))
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', endSession)
    el.addEventListener('pointercancel', endSession)
    actors.set(seed.id, actor)
    paint(actor, performance.now())
  }

  function resting(actor: Actor, now: number) {
    return actor.mode === 'nap' || now < actor.fullUntil
  }

  function settleFull(actor: Actor, now: number) {
    if (now >= actor.fullUntil) return
    if (
      actor.mode === 'pet' ||
      actor.mode === 'drag' ||
      actor.mode === 'hop' ||
      actor.mode === 'eat' ||
      actor.mode === 'play' ||
      actor.mode === 'dance'
    ) {
      return
    }
    actor.mode = 'nap'
    actor.poseUntil = actor.fullUntil
  }

  function finishEat(actor: Actor, now: number) {
    actor.favoriteBite = false
    if (actor.pendingFull) {
      actor.pendingFull = false
      actor.fullUntil = now + 20000
      actor.mode = 'nap'
      actor.poseUntil = actor.fullUntil
      return
    }
    if (now < actor.fullUntil) {
      actor.mode = 'nap'
      actor.poseUntil = actor.fullUntil
      return
    }
    actor.mode = 'idle'
    schedule(actor, now)
  }

  function tick(actor: Actor, dt: number, now: number) {
    settleFull(actor, now)
    const busy =
      actor.mode === 'pet' ||
      actor.mode === 'drag' ||
      actor.mode === 'hop' ||
      actor.mode === 'eat' ||
      actor.mode === 'play' ||
      actor.mode === 'dance'
    if (actor.mode === 'eat' && now >= actor.eatUntil) finishEat(actor, now)
    if (!busy && !paused) {
      if (actor.mode === 'walk') {
        const tx = (actor.walkTx / 100) * fieldW
        const ty = (actor.walkTy / 100) * fieldH
        const dx = tx - actor.px
        const dy = ty - actor.py
        const dist = Math.hypot(dx, dy)
        if (dist < 4) {
          actor.mode = 'idle'
          schedule(actor, now)
        } else {
          const step = Math.min(dist, 60 * dt)
          setFeet(actor, actor.px + (dx / dist) * step, actor.py + (dy / dist) * step)
          if (dx > 1.5) actor.face = -1
          else if (dx < -1.5) actor.face = 1
        }
      } else if (actor.mode === 'sit' || actor.mode === 'look' || actor.mode === 'nap') {
        if (now >= actor.poseUntil) {
          actor.mode = 'idle'
          schedule(actor, now)
        }
      } else if (actor.mode === 'idle' && now >= actor.nextThink) {
        think(actor, now)
      }
    } else if (actor.mode === 'hop' && now >= actor.hopUntil) {
      actor.mode = 'idle'
      schedule(actor, now)
    } else if (actor.mode === 'dance' && now >= actor.poseUntil) {
      actor.mode = 'idle'
      schedule(actor, now)
    }
    paint(actor, now)
  }

  function attract(now: number) {
    if (!foodHover || paused) return
    let best: Actor | null = null
    let bestD = 170
    for (const actor of actors.values()) {
      if (resting(actor, now)) continue
      if (
        actor.mode === 'pet' ||
        actor.mode === 'drag' ||
        actor.mode === 'eat' ||
        actor.mode === 'hop' ||
        actor.mode === 'play' ||
        actor.mode === 'dance'
      ) {
        continue
      }
      const d = Math.hypot(actor.px - foodHover.x, actor.py - foodHover.y)
      if (d < bestD && d > 40) {
        best = actor
        bestD = d
      }
    }
    if (!best || !foodHover) return
    best.mode = 'walk'
    best.walkTx = clamp((foodHover.x / fieldW) * 100, 12, 88)
    best.walkTy = clamp((foodHover.y / fieldH) * 100, 24, 90)
    best.hopUntil = 0
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000)
    lastFrame = now
    attract(now)
    for (const actor of actors.values()) tick(actor, dt, now)
    if (dirty && now - lastSave > 2000) flush()
    raf = requestAnimationFrame(frame)
  }

  function flush() {
    dirty = false
    lastSave = performance.now()
    const spots: MeadowSpot[] = []
    for (const actor of actors.values()) spots.push({ id: actor.id, x: Math.round(actor.x * 10) / 10, y: Math.round(actor.y * 10) / 10 })
    if (spots.length) onSave(spots)
  }

  function upsert(seed: MeadowActorSeed) {
    const existing = actors.get(seed.id)
    if (existing) {
      if (existing.mode === 'drag' || existing.mode === 'pet') return
      pin(existing, seed.x, seed.y)
      paint(existing, performance.now())
      return
    }
    add(seed, actors.size)
  }

  function callToCenter(id: string) {
    const actor = actors.get(id)
    if (!actor || actor.mode === 'drag' || actor.mode === 'pet' || actor.mode === 'eat' || actor.mode === 'play' || actor.mode === 'dance') {
      return
    }
    if (performance.now() < actor.fullUntil) return
    const now = performance.now()
    wake(actor, now)
    actor.mode = 'walk'
    actor.walkTx = 50
    actor.walkTy = 58
    actor.hopStart = now
    actor.hopUntil = now + 420
  }

  function setPaused(next: boolean) {
    paused = next
    if (!next) lastUserAt = performance.now()
  }

  function destroy() {
    cancelAnimationFrame(raf)
    resize.disconnect()
    if (session) window.clearTimeout(session.timer)
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
    flush()
    for (const actor of actors.values()) {
      window.clearTimeout(actor.bubbleTimer)
      actor.el.remove()
    }
    actors.clear()
    field.querySelectorAll('.meadow-heart, .meadow-crumb, .meadow-cloud, .meadow-meter, .meadow-note').forEach((node) => node.remove())
  }

  function hitActor(clientX: number, clientY: number): Actor | null {
    let best: Actor | null = null
    let bestD = Infinity
    for (const actor of actors.values()) {
      const rect = actor.el.getBoundingClientRect()
      const pad = 22
      if (clientX < rect.left - pad || clientX > rect.right + pad || clientY < rect.top - pad || clientY > rect.bottom + pad) {
        continue
      }
      const cx = (rect.left + rect.right) / 2
      const cy = (rect.top + rect.bottom) / 2
      const d = Math.hypot(clientX - cx, clientY - cy)
      if (!best || d < bestD - 6 || (Math.abs(d - bestD) <= 6 && actor.py > best.py)) {
        best = actor
        bestD = d
      }
    }
    return best
  }

  function mouthOf(actor: Actor): FeedMouth {
    const rect = actor.el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.42 }
  }

  function spawnCrumbs(actor: Actor) {
    for (let i = 0; i < 5; i += 1) {
      const crumb = document.createElement('i')
      crumb.className = 'meadow-crumb'
      const angle = -Math.PI / 2 + (i - 2) * 0.45
      const dist = 28 + Math.random() * 22
      crumb.style.left = `${actor.px}px`
      crumb.style.top = `${actor.py - sprite * 0.55}px`
      crumb.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
      crumb.style.setProperty('--dy', `${Math.sin(angle) * dist}px`)
      field.appendChild(crumb)
      crumb.addEventListener('animationend', () => crumb.remove())
    }
  }

  function noteBite(actor: Actor, now: number) {
    actor.fedAt = actor.fedAt.filter((at) => now - at < 120000)
    actor.fedAt.push(now)
    if (actor.fedAt.length >= 3) {
      actor.pendingFull = true
      actor.fedAt = []
    }
  }

  function hoverFood(clientX: number, clientY: number) {
    const rect = field.getBoundingClientRect()
    foodHover = { x: clientX - rect.left, y: clientY - rect.top }
  }

  function clearFoodHover() {
    foodHover = null
  }

  function dropFood(foodId: MeadowFoodId, clientX: number, clientY: number): FeedDrop {
    clearFoodHover()
    const actor = hitActor(clientX, clientY)
    if (!actor) return { result: 'miss' }
    const now = performance.now()
    const mouth = mouthOf(actor)
    if (actor.mode === 'eat' || actor.mode === 'play' || actor.mode === 'dance') return { result: 'miss' }
    if (resting(actor, now)) {
      actor.wiggleUntil = now + 700
      if (actor.mode !== 'pet' && actor.mode !== 'drag' && actor.mode !== 'hop') {
        actor.mode = 'nap'
        actor.poseUntil = Math.max(actor.poseUntil, now + 700, actor.fullUntil)
      }
      playSleepySigh()
      return { result: 'sleepy', mouth }
    }
    const favorite = isFavoriteFood(actor.id, foodId)
    const fieldRect = field.getBoundingClientRect()
    actor.face = clientX - fieldRect.left > actor.px ? -1 : 1
    actor.mode = 'eat'
    actor.eatStart = now
    actor.eatUntil = now + (favorite ? 820 : 680)
    actor.favoriteBite = favorite
    lastUserAt = now
    noteBite(actor, now)
    spawnHeart(actor)
    if (favorite) {
      for (let i = 0; i < 5; i += 1) window.setTimeout(() => spawnHeart(actor), 70 * (i + 1))
    }
    spawnCrumbs(actor)
    playChomp()
    onSpeak(yumLine(foodId, favorite))
    onFeed(actor.id, foodId, favorite)
    return { result: 'eaten', animalId: actor.id, favorite, mouth }
  }

  measure()
  options.animals.forEach((seed, index) => add(seed, index))
  resize.observe(field)
  raf = requestAnimationFrame(frame)

  function noteHearts(id: string, hearts: number, meter: boolean, chime: boolean) {
    const actor = actors.get(id)
    if (!actor) return
    actor.hearts = hearts
    actor.el.dataset.hearts = String(hearts)
    if (hearts < 3 && actor.accessory !== 'none') {
      actor.accessory = 'none'
      syncAccessory(actor, false)
    }
    if (meter) showMeter(actor)
    if (chime) {
      playHeartChime()
      for (let i = 0; i < 6; i += 1) later(() => spawnHeart(actor), i * 70)
    }
  }

  function setAccessory(id: string, accessory: MeadowAccessoryId) {
    const actor = actors.get(id)
    if (!actor || actor.hearts < 3) return
    actor.accessory = accessory
    syncAccessory(actor, true)
  }

  return { destroy, setPaused, callToCenter, upsert, hoverFood, clearFoodHover, dropFood, noteHearts, setAccessory }
}
