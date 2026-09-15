import gsap from 'gsap'

function asElement(target: unknown): Element | null {
  if (target instanceof Element) return target
  return null
}

export function tweenShake(target: unknown, intensity = 8): Promise<void> {
  const el = asElement(target)
  if (!el) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.fromTo(
      el,
      { x: 0 },
      {
        x: intensity,
        duration: 0.06,
        yoyo: true,
        repeat: 7,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.set(el, { x: 0 })
          resolve()
        },
      },
    )
  })
}

export function tweenPulse(target: unknown): Promise<void> {
  const el = asElement(target)
  if (!el) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.fromTo(
      el,
      { scale: 1 },
      {
        scale: 1.12,
        duration: 0.22,
        yoyo: true,
        repeat: 3,
        ease: 'power1.inOut',
        transformOrigin: '50% 50%',
        onComplete: () => {
          gsap.set(el, { scale: 1 })
          resolve()
        },
      },
    )
  })
}

export function tweenCelebrate(target: unknown): Promise<void> {
  const el = asElement(target)
  if (!el) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.fromTo(
      el,
      { scale: 0.84, rotate: -7 },
      {
        scale: 1,
        rotate: 0,
        duration: 0.48,
        ease: 'back.out(2.2)',
        transformOrigin: '50% 50%',
        onComplete: () => resolve(),
      },
    )
  })
}

export function tweenSnapTo(target: unknown, dest: { x: number; y: number }): Promise<void> {
  const el = asElement(target)
  if (!el) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.to(el, {
      left: dest.x,
      top: dest.y,
      duration: 0.28,
      ease: 'back.out(1.7)',
      onComplete: () => resolve(),
    })
  })
}

export function flyStarFrom(source: Element | null): Promise<void> {
  const bar = document.querySelector('.stars')
  if (!source || !bar) return Promise.resolve()
  const from = source.getBoundingClientRect()
  const to = bar.getBoundingClientRect()
  const star = document.createElement('div')
  star.textContent = '⭐'
  star.setAttribute('aria-hidden', 'true')
  star.style.cssText = [
    'position:fixed',
    `left:${from.left + from.width / 2}px`,
    `top:${from.top + from.height / 2}px`,
    'z-index:40',
    'font-size:28px',
    'pointer-events:none',
    'margin:-14px 0 0 -14px',
  ].join(';')
  document.body.appendChild(star)
  return new Promise((resolve) => {
    gsap.to(star, {
      left: to.left + to.width / 2,
      top: to.top + to.height / 2,
      scale: 0.45,
      duration: 0.55,
      ease: 'power2.inOut',
      onComplete: () => {
        star.remove()
        resolve()
      },
    })
  })
}
