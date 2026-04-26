const STORAGE_KEY = 'lang'

const ruBtn = document.getElementById('lang-ru')
const enBtn = document.getElementById('lang-en')

function setVisibleLang(lang) {
  const isRu = lang === 'ru'
  document.documentElement.lang = isRu ? 'ru' : 'en'

  for (const el of document.querySelectorAll(
    '.prose-en, .tagline-en, .hl-en, .hero-kicker-en, .hero-scroll-en, .print-lang-en'
  )) {
    el.hidden = isRu
  }
  for (const el of document.querySelectorAll(
    '.prose-ru, .tagline-ru, .hl-ru, .hero-kicker-ru, .hero-scroll-ru, .print-lang-ru'
  )) {
    el.hidden = !isRu
  }

  for (const el of document.querySelectorAll('.title-en, .footer-en')) {
    el.hidden = isRu
  }
  for (const el of document.querySelectorAll('.title-ru, .footer-ru')) {
    el.hidden = !isRu
  }

  const brandEn = document.querySelector('.brand-role-en')
  const brandRu = document.querySelector('.brand-role-ru')
  if (brandEn) brandEn.hidden = isRu
  if (brandRu) brandRu.hidden = !isRu

  ruBtn?.setAttribute('aria-pressed', String(isRu))
  enBtn?.setAttribute('aria-pressed', String(!isRu))

  localStorage.setItem(STORAGE_KEY, lang)
}

function initLang() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'en'
  setVisibleLang(saved === 'ru' ? 'ru' : 'en')

  ruBtn?.addEventListener('click', () => setVisibleLang('ru'))
  enBtn?.addEventListener('click', () => setVisibleLang('en'))
}

function initYear() {
  const y = String(new Date().getFullYear())
  for (const el of document.querySelectorAll('#year')) {
    el.textContent = y
  }
}

function initPrintPdf() {
  const btn = document.getElementById('print-pdf-btn')
  btn?.addEventListener('click', () => {
    requestAnimationFrame(() => {
      window.print()
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initLang()
  initYear()
  initPrintPdf()
})
