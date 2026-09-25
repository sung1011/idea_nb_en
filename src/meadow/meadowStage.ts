import {
  accessoryAnchor,
  accessoryFile,
  HEART_GAIN_PET,
  HEART_GAIN_PLAY,
  heartFillPercent,
  animalById,
  animalIsHungry,
  BUBBLE_HOLD_MS,
  introLine,
  meadowDecoration,
  decorHitZonesVisible,
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
  type MeadowDecorDef,
  type MeadowDecorInteraction,
  type MeadowDecorSave,
  type MeadowFoodId,
} from './meadowConfig'
import { playBoing, playChomp, playCrackle, playDropDing, playGiggle, playHeartChime, playPetChirp, playSleepySigh, playSoftChime, playWater } from './meadowAudio'
import { wordEmoji, wordImage } from '../data/phonicsFamily'

export type MeadowActorSeed = {
  id: MeadowAnimalId
  name: string
  x: number
  y: number
  hearts: number
  accessory: MeadowAccessoryId
  /** Epoch ms on the hunger clock. Fullness is derived from this, not a running timer. */
  lastFedAt: number
}

export type MeadowSpot = {
  id: MeadowAnimalId
  x: number
  y: number
}

type Mode = 'idle' | 'walk' | 'sit' | 'look' | 'nap' | 'hop' | 'pet' | 'drag' | 'eat' | 'play' | 'dance' | 'decor'

type DecorRole = 'idle' | 'special'

type DecorVisit = {
  id: string
  interaction: MeadowDecorInteraction
  role: DecorRole
  until: number
  started: number
  fired: boolean
  /** The spoken line for this visit has already played. */
  said: boolean
  fromX: number
  fromY: number
  firedAt: number
  pulses: number
}

type BallLeg = {
  fromX: number
  fromY: number
  toX: number
  toY: number
  start: number
  until: number
  apex: number
}

type BallMotion = {
  legs: BallLeg[]
  index: number
  spin0: number
  spin1: number
  hopped: Set<string>
  kickerId: string | null
  /** How many landings have already squashed and puffed. */
  landed: number
}

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
  /** Hunger-clock timestamp. Copied from the save; feeding writes a new one. */
  lastFedAt: number
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
  /** Decoration id this animal is walking toward. */
  seeking: string | null
  decor: DecorVisit | null
  /** Next time an idle, full animal may wander over to a decoration. */
  nextVisitAt: number
  lastSplash: number
  mallow: HTMLElement | null
  /** Degrees, matching the swing seat while a special ride is playing. */
  swingAngle: number
  stretchUntil: number
  /** Walking to the spot where a kicked ball will rest. Does not kick again. */
  ballFollow: boolean
  /** Extra lift in pixels, drawn with transform only. */
  launchLift: number
  exitStart: number
  exitUntil: number
  exitFromX: number
  exitFromY: number
  exitToX: number
  exitToY: number
  /** Wake-up stretch is taller than the ordinary one. */
  bigStretch: boolean
}

type Decor = {
  id: string
  def: MeadowDecorDef
  el: HTMLDivElement
  x: number
  y: number
  px: number
  py: number
  spin: number
  motion: BallMotion | null
  /** Epoch ms. While this is in the future the ball squishes on landing. */
  squashUntil: number
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
  addDecoration: (item: MeadowDecorSave, drop: boolean) => void
}

const HOLD_MS = 350
const TAP_SLOP = 10

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function actionIcon(interaction: MeadowDecorInteraction): string {
  const common = 'viewBox="0 0 32 32" aria-hidden="true"'
  switch (interaction) {
    case 'swing':
      return `<svg ${common}><path d="M7 8h18" stroke="#e0a050" stroke-width="2.4" stroke-linecap="round"/><path d="M10 8c1 8 2 12 6 12s5-4 6-12" fill="none" stroke="#e07a3d" stroke-width="2.2" stroke-linecap="round"/><rect x="11" y="19" width="10" height="3.4" rx="1.6" fill="#f4b400"/><path d="M6 16c2-3 4-3 6 0" fill="none" stroke="#f0c36a" stroke-width="1.8" stroke-linecap="round"/></svg>`
    case 'ball':
      return `<svg ${common}><path d="M9 20c1.2-6 4-9 7-9s5.6 3 6.6 9" fill="#ffd0a8"/><ellipse cx="16" cy="21.5" rx="8" ry="3.4" fill="#f0a060"/><circle cx="21" cy="17" r="1.5" fill="#e09070"/></svg>`
    case 'flower':
      return `<svg ${common}><circle cx="16" cy="13" r="3" fill="#ffe08a"/><circle cx="11" cy="12" r="2.8" fill="#ff8fab"/><circle cx="21" cy="12" r="2.8" fill="#ff8fab"/><circle cx="13" cy="17" r="2.6" fill="#ffb3c7"/><circle cx="19" cy="17" r="2.6" fill="#ffb3c7"/><path d="M16 18.5v7" stroke="#6fc45e" stroke-width="2.2" stroke-linecap="round"/></svg>`
    case 'water':
      return `<svg ${common}><ellipse cx="16" cy="22" rx="9" ry="3.6" fill="#7ec8f0"/><path d="M16 18V11" stroke="#5aa7e0" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="13" r="1.7" fill="#b9e6ff"/><circle cx="21" cy="11" r="2.1" fill="#8fd4ff"/></svg>`
    case 'fire':
      return `<svg ${common}><path d="M16 6c2 4.5 6 6.5 6 11.2a6 6 0 0 1-12 0C10 13 12.2 11 13.2 9c.2 2 1.6 2.8 2.4 2.8C15.6 9 15.6 6.8 16 6z" fill="#ff8a3d"/><path d="M16 15c.8 1.6 2 2.6 2 4.2a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2 1.3-2.8.2.7.7 1 .8 1 .1-1 .1-1.8 0-2.4z" fill="#ffe08a"/></svg>`
    case 'house':
      return `<svg ${common}><path d="M12 10a6.5 6.5 0 1 0 7.2 10A5.2 5.2 0 1 1 12 10z" fill="#f6d56a"/><path d="M22 9h6.2L22 15.2h6.2" fill="none" stroke="#c9843a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
}

function appleIcon(): string {
  return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 11c-4.2 0-8 3.6-8 8.2 0 3.6 2.8 6.3 8 6.3s8-2.7 8-6.3c0-4.6-3.8-8.2-8-8.2z" fill="#e85d4c"/><path d="M16 11c.6-3 2.6-4.4 5-4.4" fill="none" stroke="#6fc45e" stroke-width="2" stroke-linecap="round"/><ellipse cx="21.5" cy="8.2" rx="3" ry="1.5" fill="#8ed56a" transform="rotate(24 21.5 8.2)"/></svg>'
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
  /** Effective hunger clock (wall high-water + GM skip). */
  hungerNow: () => number
  /** Persist a refill and return the new lastFedAt. */
  onFedClock: (id: MeadowAnimalId) => number
  decorations: MeadowDecorSave[]
  /** Speak a decoration line only when nothing else is already talking. */
  onDecorLine: (line: string) => void
  onSaveDecor: (id: string, x: number, y: number) => void
}): MeadowStage {
  const { field, onSpeak, onSave } = options
  const actors = new Map<string, Actor>()
  const decors = new Map<string, Decor>()
  let decorDrag: { decor: Decor; pointerId: number; moved: number } | null = null
  let fieldW = 1
  let fieldH = 1
  let sprite = 96
  let paused = false
  let dirty = false
  let lastSave = 0
  let lastUserAt = performance.now()
  let session: Session | null = null
  /** Decoration currently showing the drop hint. Empty when the pet is outside every zone. */
  let dropDecorId = ''
  let gleamActor: Actor | null = null
  let hitGuides = false
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
    for (const decor of decors.values()) layoutDecor(decor)
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

  /** Move for a swing arc without writing the saved standing spot. */
  function glideFeet(actor: Actor, px: number, py: number) {
    actor.px = clamp(px, sprite * 0.35, fieldW - sprite * 0.35)
    actor.py = clamp(py, sprite * 0.45, fieldH - 6)
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
    } else if (actor.mode === 'decor' && actor.decor) {
      const pose = decorPose(actor.decor, now)
      bob = pose.bob
      sx = pose.sx
      sy = pose.sy
      rot = pose.rot
      lift = pose.lift
      if (actor.decor.interaction === 'swing' && actor.decor.role === 'special' && !actor.decor.fired) {
        rot = actor.swingAngle
      }
    }
    if (actor.launchLift > 0) lift = actor.launchLift
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
    if (now < actor.stretchUntil && actor.mode !== 'drag' && actor.mode !== 'pet') {
      if (actor.bigStretch) {
        sx = 0.7
        sy = 1.48
        lift = 16
      } else {
        sx = 0.84
        sy = 1.26
        lift = 12
      }
    }
    actor.body.style.transform = `translateY(${bob - lift}px) rotate(${rot}deg) scale(${actor.face * sx}, ${sy})`
    actor.shadow.style.transform = `scale(${shadow}, ${shadow * 0.9})`
    actor.shadow.style.opacity = String(shadowOpacity)
    const hungry = animalIsHungry(actor.lastFedAt, options.hungerNow())
    const visit = actor.decor
    const snooze = visit?.interaction === 'house' && (visit.role === 'idle' || visit.fired)
    const rosy = visit?.interaction === 'fire' && visit.role === 'special' && visit.said
    actor.el.classList.toggle('is-nap', actor.mode === 'nap')
    actor.el.classList.toggle('is-play', actor.mode === 'play')
    actor.el.classList.toggle('is-dance', actor.mode === 'dance')
    actor.el.classList.toggle('is-hidden', actor.mode === 'play')
    actor.el.classList.toggle('is-hungry', hungry)
    actor.el.classList.toggle('is-swim', visit?.interaction === 'water' && visit.role === 'special')
    actor.el.classList.toggle('is-drink', visit?.interaction === 'water' && visit.role === 'idle')
    actor.el.classList.toggle('is-warm', visit?.interaction === 'fire' && visit.role === 'idle')
    actor.el.classList.toggle('is-toast', visit?.interaction === 'fire' && visit.role === 'special')
    actor.el.classList.toggle('is-swing', visit?.interaction === 'swing')
    actor.el.classList.toggle('is-ball', visit?.interaction === 'ball')
    actor.el.classList.toggle('is-sniff', visit?.interaction === 'flower')
    actor.el.classList.toggle('is-home', visit?.interaction === 'house')
    actor.el.classList.toggle('is-snooze', !!snooze)
    actor.el.classList.toggle('is-rosy', !!rosy)
    actor.el.dataset.hunger = hungry ? 'hungry' : 'full'
    actor.el.dataset.decor = visit?.id ?? ''
    actor.el.dataset.decorRole = visit?.role ?? ''
    actor.el.dataset.seeking = actor.seeking ?? ''
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
    syncDropReady(session.actor)
  }

  function endSession(ev: PointerEvent) {
    if (!session || session.pointerId !== ev.pointerId) return
    window.clearTimeout(session.timer)
    const now = performance.now()
    const actor = session.actor
    const moved = Math.hypot(ev.clientX - session.startX, ev.clientY - session.startY)
    if (session.mode === 'pending' && now - session.startT < HOLD_MS && moved < TAP_SLOP) {
      if (actor.decor?.interaction === 'house') wakeHouse(actor, now)
      else tap(actor, now)
    } else if (session.mode === 'pet') {
      actor.mode = 'idle'
      schedule(actor, now)
    } else if (session.mode === 'drag') {
      const wasHouse = actor.decor?.interaction === 'house'
      const decor = nearestDropDecor(actor)
      const hungry = hungryNow(actor)
      const other = overlapTarget(actor)
      clearDropReady()
      if (wasHouse && !decor) {
        wakeHouse(actor, now)
        flush()
      } else {
        if (wasHouse) clearDecor(actor)
        if (decor && !hungry) beginDecor(actor, decor, 'special', now)
        else if (other) startScuffle(actor, other, now)
        else {
          hop(actor, now, 320)
          flush()
        }
      }
    }
    if (actor.el.hasPointerCapture(ev.pointerId)) actor.el.releasePointerCapture(ev.pointerId)
    session = null
  }

  function onPointerDown(actor: Actor, ev: PointerEvent) {
    if (session || ev.button !== 0 || actor.mode === 'play') return
    ev.preventDefault()
    actor.seeking = null
    actor.ballFollow = false
    if (actor.exitUntil > 0) {
      setFeet(actor, actor.px, actor.py)
      actor.exitUntil = 0
      actor.launchLift = 0
    }
    if (actor.decor && actor.decor.interaction !== 'house') clearDecor(actor)
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
    if (session.mode === 'pending' && session.moved > TAP_SLOP) {
      if (actor.decor?.interaction === 'house') beginDrag(now)
      else beginPet(now)
    }
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
      syncDropReady(actor)
    }
  }

  function add(seed: MeadowActorSeed, index: number) {
    const el = document.createElement('div')
    el.className = 'meadow-actor'
    el.dataset.id = seed.id
    const zzz = document.createElement('span')
    zzz.className = 'meadow-zzz'
    zzz.textContent = 'z z'
    for (let i = 0; i < 4; i += 1) {
      const star = document.createElement('i')
      star.className = `meadow-gleam g${i}`
      el.appendChild(star)
    }
    const body = document.createElement('div')
    body.className = 'meadow-body'
    const shadow = document.createElement('i')
    shadow.className = 'meadow-shadow'
    const img = document.createElement('img')
    img.className = 'meadow-sprite'
    img.alt = seed.name
    img.draggable = false
    img.src = meadowSrc(seed.id)
    const cheeks = document.createElement('span')
    cheeks.className = 'meadow-cheeks'
    cheeks.append(document.createElement('i'), document.createElement('i'))
    body.append(shadow, img, cheeks)
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
      lastFedAt: seed.lastFedAt,
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
      seeking: null,
      decor: null,
      nextVisitAt: performance.now() + visitDelay(),
      lastSplash: 0,
      mallow: null,
      swingAngle: 0,
      stretchUntil: 0,
      ballFollow: false,
      launchLift: 0,
      exitStart: 0,
      exitUntil: 0,
      exitFromX: 0,
      exitFromY: 0,
      exitToX: 0,
      exitToY: 0,
      bigStretch: false,
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
    if (actor.bigStretch && now >= actor.stretchUntil) actor.bigStretch = false
    if (actor.exitUntil > 0 && actor.mode !== 'drag' && actor.mode !== 'pet') {
      stepExit(actor, now)
      paint(actor, now)
      return
    }
    if (hungryNow(actor) && (actor.seeking || actor.decor || actor.ballFollow)) {
      actor.seeking = null
      actor.ballFollow = false
      clearDecor(actor)
      if (actor.mode === 'decor') {
        actor.mode = 'idle'
        schedule(actor, now)
      }
    }
    const busy =
      actor.mode === 'pet' ||
      actor.mode === 'drag' ||
      actor.mode === 'hop' ||
      actor.mode === 'eat' ||
      actor.mode === 'play' ||
      actor.mode === 'dance' ||
      actor.mode === 'decor'
    if (actor.mode === 'eat' && now >= actor.eatUntil) finishEat(actor, now)
    if (actor.mode === 'decor' && actor.decor) {
      stepDecor(actor, now)
      if (actor.decor && now >= actor.decor.until) endDecor(actor, now)
    }
    if (!busy && !paused) {
      if (actor.mode === 'walk') {
        const tx = (actor.walkTx / 100) * fieldW
        const ty = (actor.walkTy / 100) * fieldH
        const dx = tx - actor.px
        const dy = ty - actor.py
        const dist = Math.hypot(dx, dy)
        const near = actor.seeking ? 28 : 4
        if (dist < near) {
          if (actor.seeking) {
            const decor = decors.get(actor.seeking)
            const follow = actor.ballFollow
            actor.seeking = null
            actor.ballFollow = false
            if (follow) {
              actor.mode = 'idle'
              schedule(actor, now)
            } else if (decor?.def.interaction === 'ball' && !hungryNow(actor)) {
              const dir = actor.px < decor.px ? 1 : -1
              launchBall(decor, dir, 0.2, false, actor, true)
              actor.mode = 'idle'
              schedule(actor, now)
            } else if (decor && !hungryNow(actor)) beginDecor(actor, decor, 'idle', now)
            else {
              actor.mode = 'idle'
              schedule(actor, now)
            }
          } else {
            actor.mode = 'idle'
            schedule(actor, now)
          }
        } else {
          const step = Math.min(dist, (actor.ballFollow ? 240 : 60) * dt)
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
      if (!paused) maybeVisit(actor, now)
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
      if (!animalIsHungry(actor.lastFedAt, options.hungerNow())) continue
      if (resting(actor, now)) continue
      if (
        actor.mode === 'pet' ||
        actor.mode === 'drag' ||
        actor.mode === 'eat' ||
        actor.mode === 'hop' ||
        actor.mode === 'play' ||
        actor.mode === 'dance' ||
        actor.mode === 'decor'
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
    tickDecors(now)
    for (const actor of actors.values()) tick(actor, dt, now)
    syncHitGuides()
    if (session?.mode === 'drag') syncDropReady(session.actor)
    else if (dropDecorId) clearDropReady()
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
      existing.lastFedAt = seed.lastFedAt
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
    actor.seeking = null
    clearDecor(actor)
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
    for (const decor of decors.values()) decor.el.remove()
    decors.clear()
    field.querySelectorAll('.meadow-heart, .meadow-crumb, .meadow-cloud, .meadow-meter, .meadow-note, .meadow-petal, .meadow-dust, .meadow-splash').forEach((node) => node.remove())
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
    if (actor.mode === 'decor') clearDecor(actor)
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
    actor.lastFedAt = options.onFedClock(actor.id)
    return { result: 'eaten', animalId: actor.id, favorite, mouth }
  }

  function visitDelay() {
    return 20000 + Math.random() * 20000
  }

  function hungryNow(actor: Actor) {
    return animalIsHungry(actor.lastFedAt, options.hungerNow())
  }

  function decorSize(decor: Decor) {
    return sprite * (decor.def.scale ?? 1.4)
  }

  function anchorKind(interaction: MeadowDecorInteraction, role: DecorRole): 'in' | 'beside' | 'above' {
    if (interaction === 'water' && role === 'special') return 'in'
    if (interaction === 'swing') return 'above'
    if (interaction === 'house' && role === 'special') return 'in'
    return 'beside'
  }

  function decorPose(visit: DecorVisit, now: number) {
    switch (visit.interaction) {
      case 'water':
        if (visit.role === 'special') return waterPose(visit, now)
        return { bob: Math.sin(now / 260) * 2, sx: 1.06, sy: 0.86, rot: 18, lift: 0 }
      case 'fire':
        if (visit.role === 'special') {
          return {
            bob: 0,
            sx: 1.02,
            sy: 0.98,
            rot: Math.sin(now / 180) * 16,
            lift: Math.abs(Math.sin(now / 180)) * 8,
          }
        }
        return { bob: Math.sin(now / 300) * 2, sx: 1.03, sy: 0.94, rot: Math.sin(now / 280) * 5, lift: 0 }
      case 'swing':
        if (visit.role === 'idle') return { bob: 1, sx: 1.02, sy: 0.9, rot: 0, lift: 4 }
        return { bob: 0, sx: 1, sy: visit.fired ? 1 : 0.94, rot: 0, lift: 0 }
      case 'ball':
        return { bob: 0, sx: 1.12, sy: 0.78, rot: -16, lift: 0 }
      case 'flower':
        if (visit.role === 'special' && visit.fired) {
          const spinT = clamp((now - visit.firedAt) / 900, 0, 1)
          return { bob: 0, sx: 1.05, sy: 0.92, rot: -360 * spinT, lift: Math.sin(spinT * Math.PI) * sprite * 0.62 }
        }
        if (visit.role === 'special') {
          const lean = clamp((now - visit.started) / 500, 0, 1)
          return { bob: Math.sin(now / 280) * 1.5, sx: 1.04, sy: 0.9, rot: 28 * lean, lift: 0 }
        }
        return { bob: Math.sin(now / 220) * 2, sx: 1.04, sy: 0.92, rot: 18, lift: 0 }
      case 'house':
        if (visit.role === 'special' && !visit.fired) return { bob: 0, sx: 0.92, sy: 1.08, rot: 12, lift: 0 }
        return { bob: Math.sin(now / 520) * 1.2, sx: 0.56, sy: 0.5, rot: 0, lift: 2 }
    }
  }

  function waterPose(visit: DecorVisit, now: number) {
    const elapsed = now - visit.started
    if (elapsed < 700) return { bob: 0, sx: 1, sy: 1, rot: 0, lift: 0 }
    if (elapsed < 1300) {
      const k = (elapsed - 700) / 600
      return k < 0.72
        ? { bob: 0, sx: 0.86, sy: 1.18, rot: k * 18, lift: 0 }
        : { bob: 0, sx: 1.28, sy: 0.68, rot: 8, lift: 0 }
    }
    if (elapsed < 1900) {
      const k = (elapsed - 1300) / 600
      return k < 0.4
        ? { bob: 0, sx: 1.22, sy: 0.5, rot: 0, lift: 0 }
        : { bob: 0, sx: 0.92, sy: 1.24, rot: -6, lift: 0 }
    }
    if (elapsed < 2700) return { bob: 0, sx: 1.04, sy: 0.94, rot: 0, lift: 0 }
    return { bob: 0, sx: 1.06, sy: 0.9, rot: Math.sin(now / 60) * 16, lift: Math.abs(Math.sin(now / 60)) * 4 }
  }

  function layoutDecor(decor: Decor) {
    const size = decorSize(decor)
    decor.px = (decor.x / 100) * fieldW
    decor.py = (decor.y / 100) * fieldH
    decor.el.style.width = `${size}px`
    decor.el.style.height = `${size}px`
    decor.el.style.left = `${decor.px - size / 2}px`
    decor.el.style.top = `${decor.py - size}px`
    decor.el.style.zIndex = String(4 + Math.round(decor.y))
  }

  function placeForDecor(actor: Actor, decor: Decor, role: DecorRole) {
    if (decor.def.interaction === 'swing') {
      const size = decorSize(decor)
      setFeet(actor, decor.px, decor.py - size * 0.38)
      return
    }
    if (decor.def.interaction === 'water' && role === 'special') {
      const side: 1 | -1 = actor.px < decor.px ? -1 : 1
      setFeet(actor, decor.px + side * sprite * 1.45, decor.py + sprite * 0.04)
      actor.face = side === 1 ? 1 : -1
      return
    }
    if (decor.def.interaction === 'house') {
      const size = decorSize(decor)
      if (role === 'special') setFeet(actor, decor.px, decor.py + sprite * 0.55)
      else setFeet(actor, decor.px, decor.py - size * 0.2)
      return
    }
    const where = anchorKind(decor.def.interaction, role)
    if (where === 'beside') {
      const side: 1 | -1 = actor.px < decor.px ? -1 : 1
      const gap = decor.def.interaction === 'flower' ? sprite * 0.72 : sprite * 1.05
      setFeet(actor, decor.px + side * gap, decor.py)
      actor.face = side === 1 ? 1 : -1
      return
    }
    if (where === 'above') {
      setFeet(actor, decor.px, decor.py - sprite * 0.2)
      return
    }
    setFeet(actor, decor.px, decor.py)
  }

  function decorDuration(interaction: MeadowDecorInteraction, role: DecorRole) {
    if (interaction === 'house') return 30000
    if (interaction === 'swing' && role === 'idle') return 2400
    if (interaction === 'swing') return 3700
    if (interaction === 'flower' && role === 'idle') return 2400
    if (interaction === 'flower') return 3400
    if (interaction === 'ball') return 560
    if (interaction === 'water' && role === 'special') return 3800
    if (interaction === 'fire' && role === 'special') return 3200
    return 4200
  }

  function houseOccupant(decorId: string, except?: Actor) {
    for (const other of actors.values()) {
      if (other !== except && other.decor?.id === decorId && other.decor.interaction === 'house') return other
    }
    return null
  }

  function wakeHouse(actor: Actor, now: number) {
    const decor = actor.decor ? decors.get(actor.decor.id) : null
    const line = decor?.def.wakeLine ?? 'Good morning!'
    const fromX = actor.px
    const fromY = actor.py
    clearDecor(actor)
    actor.mode = 'idle'
    actor.swingAngle = 0
    actor.bigStretch = false
    if (decor) {
      actor.exitStart = now
      actor.exitUntil = now + 1100
      actor.exitFromX = fromX
      actor.exitFromY = fromY
      actor.exitToX = decor.px
      actor.exitToY = decor.py + sprite * 0.42
    } else {
      actor.bigStretch = true
      actor.stretchUntil = now + 900
    }
    schedule(actor, now)
    showDecorLine(actor, line)
  }

  function stepExit(actor: Actor, now: number) {
    const span = Math.max(1, actor.exitUntil - actor.exitStart)
    const p = clamp((now - actor.exitStart) / span, 0, 1)
    const x = actor.exitFromX + (actor.exitToX - actor.exitFromX) * p
    const y = actor.exitFromY + (actor.exitToY - actor.exitFromY) * Math.min(1, p / 0.7)
    glideFeet(actor, x, y)
    actor.launchLift = arcLift(p, sprite * 0.72)
    if (p >= 1) {
      setFeet(actor, actor.exitToX, actor.exitToY)
      actor.launchLift = 0
      actor.exitUntil = 0
      actor.bigStretch = true
      actor.stretchUntil = now + 900
    }
  }

  function rideSwing(actor: Actor, decor: Decor, now: number) {
    const size = decorSize(decor)
    const pivotX = decor.px
    const pivotY = decor.py - size * 0.94
    const arm = size * 0.58
    const angle = Math.sin((now - (actor.decor?.started ?? now)) / 280) * ((24 * Math.PI) / 180)
    actor.swingAngle = (angle * 180) / Math.PI
    glideFeet(actor, pivotX + Math.sin(angle) * arm, pivotY + Math.cos(angle) * arm)
    decor.el.classList.add('is-swinging')
    decor.el.style.setProperty('--swing', `${actor.swingAngle}deg`)
  }

  function showDecorLine(actor: Actor, line: string) {
    showBubble(actor, { kind: 'sentence', key: `decor:${line}`, speak: line, text: line })
    options.onDecorLine(line)
  }

  function showMallow(actor: Actor) {
    if (actor.mallow) return
    const stick = document.createElement('span')
    stick.className = 'meadow-mallow'
    stick.appendChild(document.createElement('i'))
    actor.el.appendChild(stick)
    actor.mallow = stick
  }

  function hideMallow(actor: Actor) {
    actor.mallow?.remove()
    actor.mallow = null
  }

  function clearDecor(actor: Actor) {
    const visit = actor.decor
    actor.decor = null
    actor.swingAngle = 0
    actor.launchLift = 0
    actor.el.classList.remove('is-rosy')
    hideMallow(actor)
    if (!visit) return
    const decor = decors.get(visit.id)
    if (!decor) return
    if (visit.interaction === 'fire') decor.el.classList.remove('is-flaring')
    if (visit.interaction === 'flower') decor.el.classList.remove('is-shaking')
    if (visit.interaction === 'house') decor.el.classList.remove('is-snoozing')
    if (visit.interaction !== 'swing') return
    const stillRiding = [...actors.values()].some(
      (other) => other.decor?.id === decor.id && other.decor.role === 'special' && !other.decor.fired,
    )
    if (!stillRiding) {
      decor.el.classList.remove('is-swinging')
      decor.el.style.removeProperty('--swing')
    }
  }

  function burstSplash(decor: Decor, count = 6, big = false) {
    const spread = big ? sprite * 0.95 : sprite * 0.55
    const rise = big ? 78 : 30
    for (let i = 0; i < count; i += 1) {
      const drop = document.createElement('i')
      drop.className = big ? 'meadow-splash is-big' : 'meadow-splash'
      drop.style.left = `${decor.px + (Math.random() - 0.5) * spread}px`
      drop.style.top = `${decor.py - sprite * (big ? 0.2 : 0.32)}px`
      drop.style.setProperty('--dx', `${(Math.random() - 0.5) * (big ? 110 : 40)}px`)
      drop.style.setProperty('--dy', `${-(big ? 28 : 16) - Math.random() * rise}px`)
      field.appendChild(drop)
      drop.addEventListener('animationend', () => drop.remove())
    }
  }

  function flingDrops(actor: Actor, count = 6) {
    for (let i = 0; i < count; i += 1) {
      const drop = document.createElement('i')
      drop.className = 'meadow-splash'
      drop.style.left = `${actor.px + (Math.random() - 0.5) * sprite * 0.5}px`
      drop.style.top = `${actor.py - sprite * 0.55}px`
      drop.style.setProperty('--dx', `${(Math.random() - 0.5) * 96}px`)
      drop.style.setProperty('--dy', `${-18 - Math.random() * 54}px`)
      field.appendChild(drop)
      drop.addEventListener('animationend', () => drop.remove())
    }
  }

  function spawnRipple(decor: Decor, wide = false) {
    const ripple = document.createElement('i')
    ripple.className = wide ? 'meadow-ripple is-wide' : 'meadow-ripple'
    decor.el.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
  }

  function spawnSparks(decor: Decor, tall = false) {
    const count = tall ? 8 : 5
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement('i')
      spark.className = tall ? 'meadow-spark is-tall' : 'meadow-spark'
      spark.style.left = `${40 + Math.random() * 20}%`
      spark.style.top = `${tall ? 18 : 28 + Math.random() * 16}%`
      spark.style.setProperty('--dx', `${(Math.random() - 0.5) * (tall ? 48 : 30)}px`)
      spark.style.setProperty('--dy', `${tall ? -40 - Math.random() * 62 : -14 - Math.random() * 26}px`)
      decor.el.appendChild(spark)
      spark.addEventListener('animationend', () => spark.remove())
    }
  }

  function makeVisit(actor: Actor, decor: Decor, role: DecorRole, now: number): DecorVisit {
    return {
      id: decor.id,
      interaction: decor.def.interaction,
      role,
      started: now,
      fired: false,
      said: false,
      fromX: actor.px,
      fromY: actor.py,
      firedAt: 0,
      pulses: 0,
      until: now + decorDuration(decor.def.interaction, role),
    }
  }

  function beginDecor(actor: Actor, decor: Decor, role: DecorRole, now: number) {
    actor.seeking = null
    actor.ballFollow = false
    if (decor.def.interaction === 'ball') {
      const dir = actor.px <= decor.px ? 1 : -1
      if (role !== 'special') {
        launchBall(decor, dir, -0.05, false, actor, true)
        hop(actor, now, 280)
        return
      }
      actor.decor = makeVisit(actor, decor, role, now)
      actor.mode = 'decor'
      actor.poseUntil = actor.decor.until
      actor.face = dir > 0 ? -1 : 1
      actor.launchLift = 0
      hideMallow(actor)
      return
    }
    if (decor.def.interaction === 'house' && houseOccupant(decor.id, actor)) {
      hop(actor, now, 320)
      return
    }
    const quiet =
      decor.def.interaction === 'flower' ||
      decor.def.interaction === 'swing' ||
      (decor.def.interaction === 'water' && role === 'special') ||
      (decor.def.interaction === 'fire' && role === 'special') ||
      (decor.def.interaction === 'house' && role === 'special')
    actor.decor = makeVisit(actor, decor, role, now)
    actor.mode = 'decor'
    actor.poseUntil = actor.decor.until
    actor.swingAngle = 0
    actor.launchLift = 0
    placeForDecor(actor, decor, role)
    actor.decor.fromX = actor.px
    actor.decor.fromY = actor.py
    if (decor.def.interaction === 'fire' && role === 'special') showMallow(actor)
    else hideMallow(actor)
    if (!quiet) showDecorLine(actor, decor.def.line)
  }

  function endDecor(actor: Actor, now: number) {
    const visit = actor.decor
    if (visit?.interaction === 'house') {
      wakeHouse(actor, now)
      actor.nextVisitAt = now + visitDelay()
      return
    }
    const decor = visit ? decors.get(visit.id) : null
    const role = visit?.role
    const interaction = visit?.interaction
    clearDecor(actor)
    actor.swingAngle = 0
    actor.launchLift = 0
    if (decor?.def.interaction === 'swing') {
      decor.el.classList.remove('is-swinging')
      decor.el.style.removeProperty('--swing')
    }
    actor.nextVisitAt = now + visitDelay()
    if (interaction === 'swing' && role === 'special') {
      setFeet(actor, actor.px, actor.py)
      actor.mode = 'idle'
      schedule(actor, now)
      return
    }
    if (interaction === 'water' && role === 'special') {
      setFeet(actor, actor.px, actor.py)
      actor.mode = 'idle'
      schedule(actor, now)
      return
    }
    if (interaction === 'swing' && decor) {
      setFeet(actor, decor.px, decor.py + sprite * 0.08)
      hop(actor, now, 360)
      return
    }
    actor.mode = 'idle'
    schedule(actor, now)
  }

  function maybeVisit(actor: Actor, now: number) {
    if (now < actor.nextVisitAt || actor.seeking || actor.decor) return
    if (hungryNow(actor)) {
      actor.nextVisitAt = now + visitDelay()
      return
    }
    if (actor.mode !== 'idle' && actor.mode !== 'walk' && actor.mode !== 'sit' && actor.mode !== 'look') return
    let choices = [...decors.values()]
    if (!choices.length) return
    if (choices.length > 1 && Math.random() > 0.18) {
      const quieter = choices.filter((decor) => decor.def.interaction !== 'house')
      if (quieter.length) choices = quieter
    }
    const decor = choices[Math.floor(Math.random() * choices.length)]!
    if (decor.def.interaction === 'house' && houseOccupant(decor.id)) {
      actor.nextVisitAt = now + visitDelay()
      return
    }
    const where = anchorKind(decor.def.interaction, 'idle')
    let x = decor.x
    let y = decor.y
    if (decor.def.interaction === 'swing') {
      const size = decorSize(decor)
      y = clamp(((decor.py - size * 0.38) / fieldH) * 100, 18, 90)
    } else if (where === 'beside') {
      const side: 1 | -1 = actor.px < decor.px ? -1 : 1
      x = clamp(((decor.px + side * sprite * 1.05) / fieldW) * 100, 8, 92)
      y = clamp(((decor.py + (decor.def.interaction === 'water' ? sprite * 0.12 : 0)) / fieldH) * 100, 20, 90)
    } else if (where === 'above') {
      y = clamp(((decor.py - sprite * 0.2) / fieldH) * 100, 18, 90)
    }
    actor.seeking = decor.id
    actor.mode = 'walk'
    actor.walkTx = x
    actor.walkTy = y
    actor.hopUntil = 0
    actor.nextVisitAt = now + visitDelay()
  }

  /** Pet sprite center, in field pixels. The drop zone uses this, not the pointer. */
  function petCenter(actor: Actor) {
    return { x: actor.px, y: actor.py - sprite * 0.5 }
  }

  /**
   * Decoration whose hit box (bounds grown about 20% on every side) contains the pet center.
   * Overlaps keep the one whose center is closest.
   */
  function nearestDropDecor(actor: Actor): Decor | null {
    const center = petCenter(actor)
    let best: Decor | null = null
    let bestD = Infinity
    for (const decor of decors.values()) {
      const size = decorSize(decor)
      const left = decor.px - size * 0.7
      const right = decor.px + size * 0.7
      const top = decor.py - size * 1.2
      const bottom = decor.py + size * 0.2
      if (center.x < left || center.x > right || center.y < top || center.y > bottom) continue
      const dx = center.x - decor.px
      const dy = center.y - (decor.py - size * 0.5)
      const dist = dx * dx + dy * dy
      if (dist < bestD) {
        best = decor
        bestD = dist
      }
    }
    return best
  }

  function clearDropReady() {
    if (dropDecorId) {
      const prev = decors.get(dropDecorId)
      if (prev) {
        prev.el.classList.remove('is-drop-ready', 'is-drop-hungry')
        prev.el.dataset.dropReady = ''
      }
      dropDecorId = ''
    }
    if (gleamActor) {
      gleamActor.el.classList.remove('is-gleam')
      gleamActor = null
    }
  }

  /** Edge-triggered: ding and vibrate only when the highlighted decoration changes. */
  function syncDropReady(actor: Actor | null) {
    if (!actor || actor.mode !== 'drag') {
      clearDropReady()
      return
    }
    const next = nearestDropDecor(actor)
    const nextId = next?.id ?? ''
    if (nextId === dropDecorId) return
    clearDropReady()
    if (!next) return
    const hungry = hungryNow(actor)
    dropDecorId = next.id
    next.el.classList.add(hungry ? 'is-drop-hungry' : 'is-drop-ready')
    next.el.dataset.dropReady = hungry ? 'hungry' : 'play'
    if (!hungry) {
      actor.el.classList.add('is-gleam')
      gleamActor = actor
      navigator.vibrate?.(20)
    }
    playDropDing(hungry)
  }

  function syncHitGuides() {
    const on = decorHitZonesVisible()
    if (on === hitGuides) return
    hitGuides = on
    for (const decor of decors.values()) decor.el.classList.toggle('is-hit-guide', on)
  }

  function moveDecor(decor: Decor, clientX: number, clientY: number) {
    const rect = field.getBoundingClientRect()
    const px = clamp(clientX - rect.left, fieldW * 0.12, fieldW * 0.88)
    const py = clamp(clientY - rect.top, fieldH * 0.3, fieldH * 0.9)
    decor.x = clamp((px / fieldW) * 100, 8, 92)
    decor.y = clamp((py / fieldH) * 100, 24, 90)
    layoutDecor(decor)
  }

  function looseLine(decor: Decor, line: string) {
    const host = document.createElement('p')
    host.className = 'meadow-decor-line'
    host.textContent = line
    decor.el.appendChild(host)
    window.setTimeout(() => host.remove(), 1600)
    options.onDecorLine(line)
  }

  function burstPetals(decor: Decor, count: number, drift = false) {
    const colors = ['#ff8fab', '#ffd166', '#fff4ea', '#c9b6ff']
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement('i')
      petal.className = drift ? 'meadow-petal is-drift' : 'meadow-petal'
      petal.style.left = `${decor.px + (Math.random() - 0.5) * sprite * 0.4}px`
      petal.style.top = `${decor.py - sprite * 0.35}px`
      petal.style.background = colors[i % colors.length] ?? '#ff8fab'
      const dir = Math.random() < 0.5 ? -1 : 1
      if (drift) {
        petal.style.setProperty('--dx', `${dir * (fieldW * 0.28 + Math.random() * fieldW * 0.5)}px`)
        petal.style.setProperty('--dy', `${-40 + Math.random() * fieldH * 0.42}px`)
        petal.style.setProperty('--rot', `${dir * (220 + Math.random() * 380)}deg`)
      } else {
        petal.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`)
        petal.style.setProperty('--dy', `${-20 - Math.random() * 48}px`)
        petal.style.setProperty('--rot', `${Math.random() * 180 - 90}deg`)
      }
      field.appendChild(petal)
      petal.addEventListener('animationend', () => petal.remove())
    }
  }

  function burstDust(x: number, y: number) {
    for (let i = 0; i < 3; i += 1) {
      const puff = document.createElement('i')
      puff.className = 'meadow-dust'
      puff.style.left = `${x + (i - 1) * 6}px`
      puff.style.top = `${y}px`
      puff.style.setProperty('--dx', `${(i - 1) * 16}px`)
      puff.style.setProperty('--dy', `${-8 - Math.random() * 12}px`)
      field.appendChild(puff)
      puff.addEventListener('animationend', () => puff.remove())
    }
  }

  function arcLift(p: number, height: number) {
    if (p < 0.62) return Math.sin((p / 0.62) * Math.PI) * height
    return Math.sin(((p - 0.62) / 0.38) * Math.PI) * height * 0.38
  }

  function meadowBox() {
    return {
      minX: fieldW * 0.12,
      maxX: fieldW * 0.88,
      minY: fieldH * 0.34,
      maxY: fieldH * 0.9,
    }
  }

  function launchBall(
    decor: Decor,
    dirX: number,
    dirY: number,
    big: boolean,
    speaker: Actor | null,
    speak: boolean,
  ) {
    const box = meadowBox()
    const count = big ? 3 : 2
    const len = Math.hypot(dirX, dirY) || 1
    let vx = (dirX / len) * fieldW * (big ? 0.85 : 0.42)
    let vy = (dirY / len) * fieldH * (big ? 0.48 : 0.22)
    if (Math.abs(vy) < fieldH * 0.12) vy = Math.sign(vy || -1) * fieldH * (big ? 0.32 : 0.16)
    let x = decor.px
    let y = decor.py
    const now = performance.now()
    const legs: BallLeg[] = []
    let t = now
    for (let i = 0; i < count; i += 1) {
      const dur = Math.round((big ? 820 : 560) * 0.75 ** i)
      const apex = sprite * (big ? 1.65 : 0.7) * 0.48 ** i
      let nx = x + vx
      let ny = y + vy
      if (nx < box.minX || nx > box.maxX) {
        const hit = nx < box.minX ? box.minX : box.maxX
        nx = hit + (hit - nx)
        vx = -vx * 0.7
      } else vx *= 0.7
      if (ny < box.minY || ny > box.maxY) {
        const hit = ny < box.minY ? box.minY : box.maxY
        ny = hit + (hit - ny)
        vy = -vy * 0.7
      } else vy *= 0.7
      nx = clamp(nx, box.minX, box.maxX)
      ny = clamp(ny, box.minY, box.maxY)
      legs.push({ fromX: x, fromY: y, toX: nx, toY: ny, start: t, until: t + dur, apex })
      t += dur
      x = nx
      y = ny
    }
    const signX = Math.sign(dirX) || 1
    decor.motion = {
      legs,
      index: 0,
      spin0: decor.spin,
      spin1: decor.spin + signX * (big ? 1080 : 540),
      hopped: new Set(),
      kickerId: speaker?.id ?? null,
      landed: 0,
    }
    decor.el.dataset.kicking = '1'
    if (speak) {
      if (speaker) showDecorLine(speaker, decor.def.line)
      else looseLine(decor, decor.def.line)
    }
    return { x, y }
  }

  function squashBall(decor: Decor, now: number) {
    decor.squashUntil = now + 140
    burstDust(decor.px, decor.py)
  }

  function paintSquash(decor: Decor, now: number) {
    if (!decor.squashUntil) return
    if (now >= decor.squashUntil) {
      decor.squashUntil = 0
      decor.el.style.setProperty('--squash-x', '1')
      decor.el.style.setProperty('--squash-y', '1')
      return
    }
    const k = (decor.squashUntil - now) / 140
    decor.el.style.setProperty('--squash-x', String(1 + 0.35 * k))
    decor.el.style.setProperty('--squash-y', String(1 - 0.38 * k))
  }

  function hopNearBall(decor: Decor, motion: BallMotion, now: number) {
    const reach = sprite * 1.2
    for (const actor of actors.values()) {
      if (motion.hopped.has(actor.id) || actor.id === motion.kickerId) continue
      if (hungryNow(actor) || actor.ballFollow || actor.decor) continue
      if (
        actor.mode === 'drag' ||
        actor.mode === 'pet' ||
        actor.mode === 'play' ||
        actor.mode === 'eat' ||
        actor.mode === 'decor'
      ) {
        continue
      }
      if (Math.hypot(actor.px - decor.px, actor.py - decor.py) < reach) {
        motion.hopped.add(actor.id)
        hop(actor, now, 380)
      }
    }
  }

  function settleBall(decor: Decor) {
    decor.motion = null
    decor.el.dataset.kicking = '0'
    decor.el.style.setProperty('--bounce', '0px')
    decor.el.style.setProperty('--shade', '1')
    options.onSaveDecor(decor.id, Math.round(decor.x * 10) / 10, Math.round(decor.y * 10) / 10)
  }

  function tickDecors(now: number) {
    for (const decor of decors.values()) {
      paintSquash(decor, now)
      const motion = decor.motion
      if (!motion || !motion.legs.length) continue
      while (motion.index < motion.legs.length - 1 && now >= motion.legs[motion.index]!.until) {
        const done = motion.legs[motion.index]!
        decor.px = done.toX
        decor.py = done.toY
        if (motion.landed <= motion.index) {
          motion.landed = motion.index + 1
          squashBall(decor, now)
        }
        motion.index += 1
      }
      const leg = motion.legs[motion.index]
      if (!leg) {
        settleBall(decor)
        continue
      }
      const span = Math.max(1, leg.until - leg.start)
      const p = clamp((now - leg.start) / span, 0, 1)
      const height = Math.sin(p * Math.PI) * leg.apex
      decor.px = leg.fromX + (leg.toX - leg.fromX) * p
      decor.py = leg.fromY + (leg.toY - leg.fromY) * p
      decor.x = clamp((decor.px / fieldW) * 100, 8, 92)
      decor.y = clamp((decor.py / fieldH) * 100, 24, 90)
      const first = motion.legs[0]!
      const last = motion.legs[motion.legs.length - 1]!
      const spinP = clamp((now - first.start) / Math.max(1, last.until - first.start), 0, 1)
      decor.spin = motion.spin0 + (motion.spin1 - motion.spin0) * spinP
      layoutDecor(decor)
      decor.el.style.setProperty('--bounce', `${-height}px`)
      decor.el.style.setProperty('--spin', `${decor.spin}deg`)
      decor.el.style.setProperty('--shade', String(clamp(1 - height / (sprite * 1.8), 0.28, 1)))
      hopNearBall(decor, motion, now)
      if (p >= 1 && motion.index === motion.legs.length - 1 && decor.motion === motion) {
        decor.px = leg.toX
        decor.py = leg.toY
        decor.x = clamp((decor.px / fieldW) * 100, 8, 92)
        decor.y = clamp((decor.py / fieldH) * 100, 24, 90)
        layoutDecor(decor)
        if (motion.landed <= motion.index) {
          motion.landed = motion.index + 1
          squashBall(decor, now)
        }
        settleBall(decor)
      }
    }
  }

  function hopNearby(origin: Actor, x: number, y: number, now: number, radius: number) {
    for (const other of actors.values()) {
      if (other === origin || hungryNow(other) || other.decor) continue
      if (
        other.mode === 'drag' ||
        other.mode === 'pet' ||
        other.mode === 'play' ||
        other.mode === 'eat' ||
        other.mode === 'decor' ||
        other.mode === 'hop'
      ) {
        continue
      }
      if (Math.hypot(other.px - x, other.py - y) < radius) hop(other, now, 420)
    }
  }

  function sparkle(actor: Actor) {
    actor.el.classList.add('is-gleam')
    const who = actor
    later(() => {
      if (gleamActor !== who) who.el.classList.remove('is-gleam')
    }, 1200)
  }

  function stepDecor(actor: Actor, now: number) {
    const visit = actor.decor
    if (!visit) return
    const decor = decors.get(visit.id)
    if (!decor) return
    actor.launchLift = 0
    switch (visit.interaction) {
      case 'ball':
        stepBallWindup(actor, decor, now)
        break
      case 'swing':
        stepSwing(actor, decor, now)
        break
      case 'flower':
        stepFlower(actor, decor, now)
        break
      case 'water':
        stepWater(actor, decor, now)
        break
      case 'fire':
        stepFire(actor, decor, now)
        break
      case 'house':
        stepHouse(actor, decor, now)
        break
    }
  }

  function stepBallWindup(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit || visit.fired) return
    const dir = actor.face === -1 ? 1 : -1
    const t = clamp((now - visit.started) / 420, 0, 1)
    glideFeet(actor, visit.fromX - dir * sprite * 0.55 * t, visit.fromY)
    if (t < 1) return
    visit.fired = true
    const rest = launchBall(decor, dir, -0.15, true, actor, true)
    clearDecor(actor)
    actor.ballFollow = true
    actor.seeking = decor.id
    actor.mode = 'walk'
    actor.walkTx = clamp(((rest.x - dir * sprite * 0.75) / fieldW) * 100, 8, 92)
    actor.walkTy = clamp((rest.y / fieldH) * 100, 24, 90)
    actor.hopUntil = 0
  }

  function stepSwing(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit) return
    if (visit.role !== 'special') {
      rideSwing(actor, decor, now)
      return
    }
    const swingMs = 2600
    const elapsed = now - visit.started
    const size = decorSize(decor)
    const pivotX = decor.px
    const pivotY = decor.py - size * 0.94
    const arm = size * 0.58
    if (elapsed < swingMs) {
      const peaks = (elapsed / swingMs) * 3
      const amp = ((28 + peaks * 54) * Math.PI) / 180
      const angle = Math.sin(peaks * Math.PI) * amp
      actor.swingAngle = (angle * 180) / Math.PI
      glideFeet(actor, pivotX + Math.sin(angle) * arm, pivotY + Math.cos(angle) * arm)
      decor.el.classList.add('is-swinging')
      decor.el.style.setProperty('--swing', `${actor.swingAngle}deg`)
      if (!visit.said && peaks >= 2.35) {
        visit.said = true
        showDecorLine(actor, decor.def.line)
      }
      return
    }
    if (!visit.fired) {
      visit.fired = true
      visit.fromX = actor.px
      visit.fromY = actor.py
      actor.swingAngle = 0
      decor.el.classList.remove('is-swinging')
      decor.el.style.removeProperty('--swing')
    }
    const lp = clamp((elapsed - swingMs) / 1100, 0, 1)
    const ground = decor.py + sprite * 0.02
    const x = visit.fromX + sprite * 2.1 * (1 - (1 - lp) * (1 - lp))
    const y = visit.fromY + (ground - visit.fromY) * Math.min(1, lp / 0.55)
    glideFeet(actor, x, y)
    actor.launchLift = arcLift(lp, sprite * 1.05)
    actor.face = -1
    if (!visit.pulses && lp >= 0.58) {
      visit.pulses = 1
      sparkle(actor)
    }
  }

  function stepFlower(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit || visit.role !== 'special' || visit.fired) return
    if (now - visit.started < 1400) return
    visit.fired = true
    visit.firedAt = now
    burstPetals(decor, 18, true)
    decor.el.classList.add('is-shaking')
    const bed = decor.el
    later(() => bed.classList.remove('is-shaking'), 700)
    showDecorLine(actor, decor.def.line)
  }

  function stepWater(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit || visit.role !== 'special') return
    const elapsed = now - visit.started
    const side: 1 | -1 = visit.fromX < decor.px ? -1 : 1
    const edgeX = decor.px + side * sprite * 0.42
    const edgeY = decor.py
    if (elapsed < 700) {
      const p = elapsed / 700
      const n = p < 0.5 ? 0 : 1
      const local = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5
      const prev = n === 0 ? 0 : 0.38
      const next = n === 0 ? 0.38 : 1
      const along = prev + (next - prev) * local
      glideFeet(
        actor,
        visit.fromX + (edgeX - visit.fromX) * along,
        visit.fromY + (edgeY - visit.fromY) * along,
      )
      actor.launchLift = Math.sin(local * Math.PI) * sprite * 0.22
      return
    }
    if (elapsed < 1300) {
      const k = (elapsed - 700) / 600
      glideFeet(actor, edgeX + (decor.px - edgeX) * k, edgeY + (decor.py - edgeY) * Math.min(1, k))
      actor.launchLift = Math.sin(k * Math.PI) * sprite * 1.25
      return
    }
    if (!visit.fired) {
      visit.fired = true
      visit.firedAt = now
      showDecorLine(actor, decor.def.line)
      burstSplash(decor, 16, true)
      spawnRipple(decor, true)
      later(() => spawnRipple(decor, true), 150)
      later(() => spawnRipple(decor, true), 300)
      playWater()
      hopNearby(actor, decor.px, decor.py, now, sprite * 2.4)
    }
    if (elapsed < 1900) {
      const k = (elapsed - 1300) / 600
      glideFeet(actor, decor.px, decor.py - sprite * 0.04)
      actor.launchLift = k < 0.45 ? 2 : Math.sin(((k - 0.45) / 0.55) * Math.PI) * sprite * 0.55
      return
    }
    const outX = decor.px + side * sprite * 0.9
    const outY = decor.py + sprite * 0.08
    if (elapsed < 2700) {
      const k = (elapsed - 1900) / 800
      glideFeet(actor, decor.px + (outX - decor.px) * k, decor.py + (outY - decor.py) * k)
      actor.launchLift = Math.sin(k * Math.PI) * sprite * 0.38
      return
    }
    glideFeet(actor, outX, outY)
    actor.launchLift = 0
    const shakeTick = Math.floor((elapsed - 2700) / 220)
    if (shakeTick > visit.pulses && shakeTick < 4) {
      visit.pulses = shakeTick
      flingDrops(actor, 5)
    }
  }

  function stepFire(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit || visit.role !== 'special') return
    if (!visit.fired && now - visit.started > 80) {
      visit.fired = true
      decor.el.classList.add('is-flaring')
      spawnSparks(decor, true)
      later(() => spawnSparks(decor, true), 420)
      later(() => spawnSparks(decor, true), 880)
    }
    if (!visit.said && now - visit.started > 400) {
      visit.said = true
      showDecorLine(actor, decor.def.line)
    }
  }

  function stepHouse(actor: Actor, decor: Decor, now: number) {
    const visit = actor.decor
    if (!visit) return
    if (visit.role !== 'special') {
      decor.el.classList.add('is-snoozing')
      return
    }
    const elapsed = now - visit.started
    const size = decorSize(decor)
    const doorX = decor.px
    const doorY = decor.py - size * 0.2
    if (elapsed < 900) {
      const p = elapsed / 900
      glideFeet(
        actor,
        visit.fromX + (doorX - visit.fromX) * p,
        visit.fromY + (doorY - visit.fromY) * Math.min(1, p * 1.15),
      )
      actor.launchLift = Math.sin(Math.min(1, p * 1.2) * Math.PI) * sprite * 0.45
      if (!visit.said && p >= 0.45) {
        visit.said = true
        showDecorLine(actor, decor.def.line)
      }
      return
    }
    if (!visit.fired) {
      visit.fired = true
      decor.el.classList.add('is-snoozing')
      setFeet(actor, doorX, doorY)
    }
  }

  function tapDecor(decor: Decor) {
    if (decor.def.interaction === 'water') {
      spawnRipple(decor)
      playWater()
      return
    }
    if (decor.def.interaction === 'fire') {
      spawnSparks(decor)
      playCrackle()
      return
    }
    if (decor.def.interaction === 'ball') {
      const dir = Math.random() < 0.5 ? -1 : 1
      launchBall(decor, dir, Math.random() * 0.4 - 0.1, false, null, true)
      return
    }
    if (decor.def.interaction === 'flower') {
      burstPetals(decor, 4)
      playSoftChime()
      return
    }
    if (decor.def.interaction === 'house') {
      const sleeper = houseOccupant(decor.id)
      if (sleeper) {
        wakeHouse(sleeper, performance.now())
        return
      }
    }
    decor.el.classList.remove('is-tap')
    void decor.el.offsetWidth
    decor.el.classList.add('is-tap')
    playBoing()
  }

  function onDecorDown(decor: Decor, ev: PointerEvent) {
    if (session || decorDrag || ev.button !== 0) return
    ev.preventDefault()
    ev.stopPropagation()
    decor.el.setPointerCapture(ev.pointerId)
    decorDrag = { decor, pointerId: ev.pointerId, moved: 0 }
  }

  function onDecorMove(ev: PointerEvent) {
    if (!decorDrag || decorDrag.pointerId !== ev.pointerId) return
    decorDrag.moved += Math.hypot(ev.movementX, ev.movementY)
    if (decorDrag.moved > TAP_SLOP) moveDecor(decorDrag.decor, ev.clientX, ev.clientY)
  }

  function onDecorUp(ev: PointerEvent) {
    if (!decorDrag || decorDrag.pointerId !== ev.pointerId) return
    const drag = decorDrag
    decorDrag = null
    if (drag.decor.el.hasPointerCapture(ev.pointerId)) drag.decor.el.releasePointerCapture(ev.pointerId)
    if (drag.moved < TAP_SLOP) {
      tapDecor(drag.decor)
      return
    }
    options.onSaveDecor(drag.decor.id, Math.round(drag.decor.x * 10) / 10, Math.round(drag.decor.y * 10) / 10)
  }

  function addDecoration(item: MeadowDecorSave, drop: boolean) {
    const def = meadowDecoration(item.id)
    if (!def || decors.has(item.id)) return
    const el = document.createElement('div')
    el.className = `meadow-decor is-${def.interaction}`
    if (drop) el.classList.add('is-dropping')
    el.dataset.id = def.id
    el.dataset.interaction = def.interaction
    const ring = document.createElement('i')
    ring.className = 'meadow-drop-ring'
    const fit = document.createElement('div')
    fit.className = 'meadow-decor-fit'
    const img = document.createElement('img')
    img.alt = def.zh
    img.draggable = false
    img.src = meadowSrc(def.file)
    fit.appendChild(img)
    const bubble = document.createElement('div')
    bubble.className = 'meadow-drop-bubble'
    bubble.innerHTML = `<span class="meadow-drop-icon is-action">${actionIcon(def.interaction)}</span><span class="meadow-drop-icon is-apple">${appleIcon()}</span>`
    const guide = document.createElement('i')
    guide.className = 'meadow-hit-guide'
    el.append(ring, fit, bubble, guide)
    if (def.interaction === 'ball') {
      const shade = document.createElement('i')
      shade.className = 'meadow-ball-shadow'
      el.insertBefore(shade, fit)
    }
    if (hitGuides) el.classList.add('is-hit-guide')
    field.appendChild(el)
    const decor: Decor = { id: def.id, def, el, x: item.x, y: item.y, px: 0, py: 0, spin: 0, motion: null, squashUntil: 0 }
    decors.set(def.id, decor)
    layoutDecor(decor)
    if (drop) el.addEventListener('animationend', () => el.classList.remove('is-dropping'), { once: true })
    el.addEventListener('pointerdown', (ev) => onDecorDown(decor, ev))
    el.addEventListener('pointermove', onDecorMove)
    el.addEventListener('pointerup', onDecorUp)
    el.addEventListener('pointercancel', onDecorUp)
  }

  measure()
  options.animals.forEach((seed, index) => add(seed, index))
  options.decorations.forEach((item) => addDecoration(item, false))
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

  return { destroy, setPaused, callToCenter, upsert, hoverFood, clearFoodHover, dropFood, noteHearts, setAccessory, addDecoration }
}
