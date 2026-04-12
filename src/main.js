import { initAttentionField } from './attentionField.js'
import { initScrollReveal } from './scrollReveal.js'

const STORAGE_KEY = 'lang'

const ruBtn = document.getElementById('lang-ru')
const enBtn = document.getElementById('lang-en')

function setVisibleLang(lang) {
  const isRu = lang === 'ru'
  document.documentElement.lang = isRu ? 'ru' : 'en'

  for (const el of document.querySelectorAll(
    '.prose-en, .tagline-en, .hl-en, .hero-kicker-en, .hero-scroll-en'
  )) {
    el.hidden = isRu
  }
  for (const el of document.querySelectorAll(
    '.prose-ru, .tagline-ru, .hl-ru, .hero-kicker-ru, .hero-scroll-ru'
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

document.addEventListener('DOMContentLoaded', () => {
  initLang()
  initYear()
  initScrollReveal()

  const hero = document.querySelector('.hero-immersive')
  const canvas = document.getElementById('attention-field')
  if (hero instanceof HTMLElement && canvas instanceof HTMLCanvasElement) {
    initAttentionField(canvas, hero)
  }
})
