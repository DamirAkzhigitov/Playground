/**
 * Subtle section entrances on scroll (respects prefers-reduced-motion via CSS).
 */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function initScrollReveal() {
  if (prefersReducedMotion()) {
    for (const el of document.querySelectorAll('[data-reveal]')) {
      el.classList.add('reveal-visible')
    }
    return
  }

  const els = document.querySelectorAll('[data-reveal]')
  if (!els.length) return

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('reveal-visible')
        io.unobserve(e.target)
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
  )

  for (const el of els) {
    io.observe(el)
  }
}
