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

// ----- Random recipes -----
const recipes = [
  {
    id: 'omelette',
    ru: {
      title: 'Омлет с зеленью',
      time: '10 минут',
      ingredients: ['2 яйца', 'щепотка соли', 'зелень', '1 ст. л. масла'],
      steps: [
        'Взбейте яйца с солью',
        'Разогрейте сковороду с маслом',
        'Вылейте яйца, добавьте зелень, жарьте 2–3 минуты'
      ]
    },
    en: {
      title: 'Herb Omelette',
      time: '10 min',
      ingredients: ['2 eggs', 'pinch of salt', 'herbs', '1 tbsp oil'],
      steps: [
        'Whisk eggs with salt',
        'Heat a pan with oil',
        'Pour eggs, add herbs, cook 2–3 minutes'
      ]
    }
  },
  {
    id: 'pasta-garlic',
    ru: {
      title: 'Паста с чесноком и маслом',
      time: '15 минут',
      ingredients: [
        'спагетти 180 г',
        '2 зубчика чеснока',
        'оливковое масло',
        'соль'
      ],
      steps: [
        'Сварите пасту до al dente',
        'Обжарьте чеснок в масле 30 секунд',
        'Смешайте с пастой, посолите'
      ]
    },
    en: {
      title: 'Garlic Butter Pasta',
      time: '15 min',
      ingredients: [
        'spaghetti 180g',
        '2 garlic cloves',
        'olive oil/butter',
        'salt'
      ],
      steps: [
        'Cook pasta al dente',
        'Sauté garlic in oil/butter for 30s',
        'Toss with pasta and salt'
      ]
    }
  },
  {
    id: 'salad',
    ru: {
      title: 'Лёгкий салат',
      time: '8 минут',
      ingredients: [
        'помидор',
        'огурец',
        'листовой салат',
        'оливковое масло',
        'соль'
      ],
      steps: ['Нарежьте овощи', 'Заправьте маслом и солью', 'Перемешайте']
    },
    en: {
      title: 'Easy Salad',
      time: '8 min',
      ingredients: ['tomato', 'cucumber', 'lettuce', 'olive oil', 'salt'],
      steps: ['Chop veggies', 'Dress with oil and salt', 'Toss']
    }
  }
]

function t(keyRu, keyEn) {
  const lang = localStorage.getItem('lang') || 'ru'
  return lang === 'ru' ? keyRu : keyEn
}

function renderRecipeCard(r) {
  const lang = localStorage.getItem('lang') || 'ru'
  const data = r[lang]
  return `
    <h3>${data.title}</h3>
    <p class="muted">${t('Время приготовления', 'Cook time')}: ${data.time}</p>
    <p class="muted">${t('Ингредиенты', 'Ingredients')}:</p>
    <ul>${data.ingredients.map((i) => `<li>${i}</li>`).join('')}</ul>
    <p class="muted" style="margin-top:.5rem">${t('Шаги', 'Steps')}:</p>
    <ol>${data.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
  `
}

function initRecipes() {
  const btn = document.getElementById('recipeButton')
  const card = document.getElementById('recipe')
  if (!btn || !card) return
  const pick = () => recipes[Math.floor(Math.random() * recipes.length)]
  const update = () => {
    const r = pick()
    card.innerHTML = renderRecipeCard(r)
  }
  btn.addEventListener('click', update)
}

document.addEventListener('DOMContentLoaded', () => {
  init()
  initRecipes()
})
