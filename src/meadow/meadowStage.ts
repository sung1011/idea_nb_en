import {
  introLine,
  isFavoriteFood,
  meadowSrc,
  onFeed,
  yumLine,
  type MeadowAnimalId,
  type MeadowFoodId,
} from './meadowConfig'
import { playChomp, playPetChirp, playSleepySigh } from './meadowAudio'

export type MeadowActorSeed = {
  id: MeadowAnimalId
  name: string
  x: number
  y: number
}

export type MeadowSpot = {
  id: MeadowAnimalId
  x: number
  y: number
}

type Mode = 'idle' | 'walk' | 'sit' | 'look' | 'nap' | 'hop' | 'pet' | 'drag' | 'eat'

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
}

const HOLD_MS = 350
const TAP_SLOP = 10

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * One animation frame drives every animal.
 * Phase 2 can call `onFeed` from a treat drop; phase 3 replaces the beside-drop with `onPlayTogether`.
 */
export function createMeadowStage(options: {
  field: HTMLElement
  animals: MeadowActorSeed[]
  onSpeak: (line: string) => void
  onSave: (spots: MeadowSpot[]) => void
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
    actor.el.style.zIndex = actor.mode === 'drag' ? '40' : String(8 + Math.round(actor.y))
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

  function nearest(actor: Actor): Actor | null {
    let best: Actor | null = null
    let bestD = 78
    for (const other of actors.values()) {
      if (other === actor) continue
      const d = Math.hypot(other.px - actor.px, other.py - actor.py)
      if (d < bestD) {
        best = other
        bestD = d
      }
    }
    return best
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

  function tap(actor: Actor, now: number) {
    wake(actor, now)
    hop(actor, now, 450)
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
      const other = nearest(actor)
      if (other) {
        // Phase 3: onPlayTogether(actor.id, other.id). For now, set it down beside them.
        let nx = other.x + 16
        if (nx > 88) nx = other.x - 16
        pin(actor, nx, other.y)
        dirty = true
      }
      hop(actor, now, 320)
      flush()
    }
    if (actor.el.hasPointerCapture(ev.pointerId)) actor.el.releasePointerCapture(ev.pointerId)
    session = null
  }

  function onPointerDown(actor: Actor, ev: PointerEvent) {
    if (session || ev.button !== 0) return
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
    }
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
    if (actor.mode === 'pet' || actor.mode === 'drag' || actor.mode === 'hop' || actor.mode === 'eat') return
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
    const busy = actor.mode === 'pet' || actor.mode === 'drag' || actor.mode === 'hop' || actor.mode === 'eat'
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
    }
    paint(actor, now)
  }

  function attract(now: number) {
    if (!foodHover || paused) return
    let best: Actor | null = null
    let bestD = 170
    for (const actor of actors.values()) {
      if (resting(actor, now)) continue
      if (actor.mode === 'pet' || actor.mode === 'drag' || actor.mode === 'eat' || actor.mode === 'hop') continue
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
    if (!actor || actor.mode === 'drag' || actor.mode === 'pet' || actor.mode === 'eat') return
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
    flush()
    for (const actor of actors.values()) actor.el.remove()
    actors.clear()
    field.querySelectorAll('.meadow-heart, .meadow-crumb').forEach((node) => node.remove())
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
    if (actor.mode === 'eat') return { result: 'miss' }
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

  return { destroy, setPaused, callToCenter, upsert, hoverFood, clearFoodHover, dropFood }
}
