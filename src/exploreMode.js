const STORAGE_MODE = 'siteMode'
const LINKEDIN = 'https://www.linkedin.com/in/damir-akzhigitov'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function readModeFromUrl() {
  try {
    const q = new URLSearchParams(window.location.search).get('mode')
    if (q === 'read') return true
    if (q === 'explore') return false
    if (window.location.hash === '#read') return true
  } catch {
    /* ignore */
  }
  return null
}

function readModeFromStorage() {
  try {
    const v = localStorage.getItem(STORAGE_MODE)
    if (v === 'read') return true
    if (v === 'explore') return false
  } catch {
    /* ignore */
  }
  return null
}

/** @returns {'read' | 'explore'} */
export function resolveInitialMode() {
  const url = readModeFromUrl()
  if (url !== null) return url
  if (prefersReducedMotion()) return 'read'
  const stored = readModeFromStorage()
  if (stored !== null) return stored
  return 'explore'
}

/** @param {'read' | 'explore'} mode */
export function applyMode(mode) {
  const root = document.documentElement
  root.classList.remove('mode-read', 'mode-explore')
  root.classList.add(mode === 'read' ? 'mode-read' : 'mode-explore')

  const details = document.querySelectorAll('details.resume-details')
  for (const d of details) {
    if (mode === 'read') {
      d.open = true
      d.classList.add('details-open')
    } else {
      d.open = false
      d.classList.remove('details-open')
    }
  }

  try {
    localStorage.setItem(STORAGE_MODE, mode)
  } catch {
    /* ignore */
  }

  syncUrlHash(mode)
  updateModeToggleUi(mode)
  updateProgress()
}

function syncUrlHash(mode) {
  try {
    const url = new URL(window.location.href)
    if (mode === 'read') {
      url.hash = 'read'
    } else if (url.hash === '#read') {
      url.hash = ''
    }
    window.history.replaceState({}, '', url.toString())
  } catch {
    /* ignore */
  }
}

function updateModeToggleUi(mode) {
  const exploreBtn = document.getElementById('mode-explore')
  const readBtn = document.getElementById('mode-read')
  const isRead = mode === 'read'
  exploreBtn?.setAttribute('aria-pressed', String(!isRead))
  readBtn?.setAttribute('aria-pressed', String(isRead))
}

export function updateProgress() {
  const all = document.querySelectorAll('details.resume-details')
  const opened = document.querySelectorAll('details.resume-details[open]')
  const total = all.length
  const done = opened.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const ring = document.getElementById('explore-progress-ring')
  const label = document.getElementById('explore-progress-label')
  const labelRu = document.getElementById('explore-progress-label-ru')

  if (ring) {
    const r = 18
    const c = 2 * Math.PI * r
    ring.style.strokeDasharray = `${String(c)} ${String(c)}`
    ring.style.strokeDashoffset = String(c * (1 - pct / 100))
  }
  if (label) {
    label.textContent = `${String(done)}/${String(total)} unlocked`
  }
  if (labelRu) {
    labelRu.textContent = `${String(done)}/${String(total)} открыто`
  }

  const article = document.getElementById('resume-content')
  const explore = document.documentElement.classList.contains('mode-explore')
  article?.classList.toggle(
    'explore-complete',
    explore && total > 0 && done === total
  )

  const progressWrap = document.querySelector('.explore-progress')
  if (progressWrap) {
    const ru = document.documentElement.lang === 'ru'
    progressWrap.setAttribute(
      'aria-label',
      ru ? 'Открыто блоков резюме' : 'Resume sections unlocked'
    )
  }
}

export function initExploreMode() {
  const initial = resolveInitialMode()
  applyMode(initial)

  document.getElementById('mode-explore')?.addEventListener('click', () => {
    applyMode('explore')
  })
  document.getElementById('mode-read')?.addEventListener('click', () => {
    applyMode('read')
  })

  for (const d of document.querySelectorAll('details.resume-details')) {
    d.addEventListener('toggle', () => {
      if (d.open) d.classList.add('details-open')
      else d.classList.remove('details-open')
      if (document.documentElement.classList.contains('mode-explore')) {
        updateProgress()
      }
    })
  }

  document.getElementById('header-linkedin')?.setAttribute('href', LINKEDIN)
}
