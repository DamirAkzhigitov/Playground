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

  const narrow =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(max-width: 767px)').matches
  const rootMargin = narrow ? '0px 0px -2% 0px' : '0px 0px -8% 0px'
  const threshold = narrow ? 0.04 : 0.08

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('reveal-visible')
        io.unobserve(e.target)
      }
    },
    { threshold, rootMargin }
  )

  for (const el of els) {
    io.observe(el)
  }
}
