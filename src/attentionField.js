/**
 * Interactive particle constellation for the hero: soft physics + pointer attraction.
 * Pointer is tracked on the hero region so the panel stays clickable (canvas is pointer-events: none).
 */

const ACCENT = { r: 165, g: 180, b: 252 }

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

class Particle {
  /**
   * @param {number} w
   * @param {number} h
   * @param {number} i
   * @param {number} total
   */
  constructor(w, h, i, total) {
    const t = (i / Math.max(1, total)) * Math.PI * 2
    const cx = w * 0.5
    const cy = h * 0.42
    const u = (Math.random() + (i % 7) / 7) % 1
    const v = (Math.random() + Math.floor(i / 7) / 9) % 1
    const spreadX = 12 + u * (w - 24)
    const spreadY = 12 + v * (h - 24)
    this.baseX = cx + (spreadX - cx) * 0.92
    this.baseY = cy + (spreadY - cy) * 0.78
    this.x = this.baseX + (Math.random() - 0.5) * 12
    this.y = this.baseY + (Math.random() - 0.5) * 12
    this.vx = (Math.random() - 0.5) * 0.35
    this.vy = (Math.random() - 0.5) * 0.35
    this.phase = t + Math.random() * 0.8
    this.wander = 0.4 + Math.random() * 0.55
    this.z = 0.35 + Math.random() * 0.65
  }

  /**
   * @param {number} w
   * @param {number} h
   * @param {number} dt
   * @param {{ x: number; y: number; strength: number }} attract
   */
  step(w, h, dt, attract) {
    const cx = w * 0.5
    const cy = h * 0.4
    this.phase += dt * (0.25 + this.wander * 0.2)

    const orbitX = Math.cos(this.phase) * (w * 0.018 * this.wander)
    const orbitY = Math.sin(this.phase * 1.07) * (h * 0.014 * this.wander)

    const homeX = this.baseX + orbitX
    const homeY = this.baseY + orbitY

    const dxA = attract.x - this.x
    const dyA = attract.y - this.y
    const distA = Math.hypot(dxA, dyA) + 0.001
    const pull = (attract.strength * this.z) / (distA * 0.018 + 12)

    const dxH = homeX - this.x
    const dyH = homeY - this.y

    const ax = dxH * 0.014 + (dxA / distA) * pull + (Math.random() - 0.5) * 0.02
    const ay = dyH * 0.014 + (dyA / distA) * pull + (Math.random() - 0.5) * 0.02

    this.vx = (this.vx + ax * dt) * 0.985
    this.vy = (this.vy + ay * dt) * 0.985

    this.x += this.vx * dt
    this.y += this.vy * dt

    const margin = 8
    if (this.x < margin) {
      this.x = margin
      this.vx *= -0.35
    } else if (this.x > w - margin) {
      this.x = w - margin
      this.vx *= -0.35
    }
    if (this.y < margin) {
      this.y = margin
      this.vy *= -0.35
    } else if (this.y > h - margin) {
      this.y = h - margin
      this.vy *= -0.35
    }

    // Gentle drift back toward layout center so the swarm stays balanced
    const dxC = cx - this.x
    const dyC = cy - this.y
    this.vx += dxC * 0.000012 * dt
    this.vy += dyC * 0.00001 * dt
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} hero
 */
export function initAttentionField(canvas, hero) {
  if (!canvas || !hero || prefersReducedMotion()) return () => {}

  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  let particles = []
  let width = 0
  let height = 0
  let dpr = 1
  let raf = 0
  let last = 0
  let intro = 0
  const introDuration = 1.35

  const pointer = {
    x: 0,
    y: 0,
    active: false,
    /** @type {number} */
    strength: 0
  }

  const burst = { t: 0, active: true }

  function syncSize() {
    const rect = hero.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const area = width * height
    const count = clamp(Math.floor(area / 11000), 48, 132)
    particles = []
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(width, height, i, count))
    }

    pointer.x = width * 0.5
    pointer.y = height * 0.38
    pointer.strength = 0
  }

  function heroPoint(clientX, clientY) {
    const r = hero.getBoundingClientRect()
    return {
      x: clientX - r.left,
      y: clientY - r.top
    }
  }

  function onPointerMove(e) {
    const p = heroPoint(e.clientX, e.clientY)
    if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) {
      pointer.active = false
      pointer.strength *= 0.92
      return
    }
    pointer.active = true
    pointer.x = clamp(p.x, 0, width)
    pointer.y = clamp(p.y, 0, height)
    pointer.strength = clamp(pointer.strength + 2.4, 0, 120)
  }

  function onPointerLeave() {
    pointer.active = false
  }

  /** @param {number} time */
  function frame(time) {
    if (!last) last = time
    const dt = clamp(time - last, 8, 40)
    last = time

    intro = Math.min(intro + dt / 1000 / introDuration, 1)
    const introEased = 1 - (1 - intro) ** 3

    if (burst.active) {
      burst.t += dt / 1000
      if (burst.t > 0.85) burst.active = false
    }

    if (!pointer.active) {
      pointer.strength *= 0.97
    }

    const burstMag =
      burst.active && burst.t < 0.85
        ? Math.sin((burst.t / 0.85) * Math.PI) * 95 * (1 - burst.t * 0.4)
        : 0

    const attract = {
      x: pointer.x,
      y: pointer.y,
      strength: pointer.strength * introEased + burstMag * introEased
    }

    for (const p of particles) {
      p.step(width, height, dt * 0.085, attract)
    }

    ctx.clearRect(0, 0, width, height)

    const linkDist = clamp(Math.min(width, height) * 0.065, 52, 118)
    const linkDistSq = linkDist * linkDist

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i]
        const b = particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 > linkDistSq) continue
        const alpha = (1 - d2 / linkDistSq) * 0.22 * introEased
        ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    for (const p of particles) {
      const alpha = (0.12 + p.z * 0.55) * introEased
      ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.1 + p.z * 1.6, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.04 * introEased})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(attract.x, attract.y, 3.5 + attract.strength * 0.06, 0, Math.PI * 2)
    ctx.stroke()

    raf = window.requestAnimationFrame(frame)
  }

  syncSize()
  window.addEventListener('resize', syncSize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  hero.addEventListener('pointerleave', onPointerLeave)

  raf = window.requestAnimationFrame(frame)

  return () => {
    window.cancelAnimationFrame(raf)
    window.removeEventListener('resize', syncSize)
    window.removeEventListener('pointermove', onPointerMove)
    hero.removeEventListener('pointerleave', onPointerLeave)
  }
}
