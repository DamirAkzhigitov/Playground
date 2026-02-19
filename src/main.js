// Initialize language switcher and author bio visibility
console.log('Playground: language switcher ready')

const ruBtn = document.getElementById('lang-ru')
const enBtn = document.getElementById('lang-en')
const ruBio = document.querySelector('.bio-ru')
const enBio = document.querySelector('.bio-en')

function applyLang(lang) {
  const isRu = lang === 'ru'
  ruBio?.classList.toggle('visible', isRu)
  enBio?.classList.toggle('visible', !isRu)
  ruBtn?.setAttribute('aria-pressed', String(isRu))
  enBtn?.setAttribute('aria-pressed', String(!isRu))
  localStorage.setItem('lang', lang)
  // Update <html lang="..">
  document.documentElement.setAttribute('lang', isRu ? 'ru' : 'en')
}

function init() {
  const saved = localStorage.getItem('lang') || 'ru'
  applyLang(saved)

  ruBtn?.addEventListener('click', () => applyLang('ru'))
  enBtn?.addEventListener('click', () => applyLang('en'))
}

document.addEventListener('DOMContentLoaded', init)
