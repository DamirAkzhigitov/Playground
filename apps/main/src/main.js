import { registerGlobalHeader } from '@playground/global-header'

registerGlobalHeader()

function initYear() {
  const year = document.getElementById('year')
  if (year) {
    year.textContent = String(new Date().getFullYear())
  }
}

function initLocalProjectLinks() {
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
    window.location.hostname
  )

  if (!isLocalHost) return

  const projectLinks = document.querySelectorAll('a[data-local-href]')
  for (const link of projectLinks) {
    if (!(link instanceof HTMLAnchorElement)) continue

    const localHref = link.dataset.localHref
    if (localHref) {
      link.href = localHref
    }
  }
}

/**
 * @param {HTMLElement | null} el
 * @param {unknown} value
 * @param {string} suffix
 */
function setStatText(el, value, suffix) {
  if (!el) return
  if (typeof value !== 'number' || Number.isNaN(value)) {
    el.textContent = '--'
    return
  }
  el.textContent = `${value.toLocaleString()} ${suffix}`
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats')
    if (!res.ok) return

    const data = await res.json()

    setStatText(
      document.querySelector('[data-project="resume"] [data-stat="views"]'),
      data.views?.resume,
      'views'
    )
    setStatText(
      document.querySelector('[data-project="compare"] [data-stat="views"]'),
      data.views?.compare,
      'views'
    )
    setStatText(
      document.querySelector('[data-project="compare"] [data-stat="users"]'),
      data.users?.compare,
      'users'
    )
  } catch {
    /* leave placeholders */
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initYear()
  initLocalProjectLinks()
  void fetchStats()
})
