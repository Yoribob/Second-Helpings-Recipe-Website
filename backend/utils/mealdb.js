 
















const {
  SUGGESTED_CATEGORIES,
  SUGGESTED_CUISINES,
  DIETARY_TAGS
} = require('./recipeConstants')


const CATEGORY_MAP = {
  Breakfast: 'Breakfast',
  Dessert: 'Dessert',
  Side: 'Side Dish',
  Starter: 'Appetizer',
  Beef: 'Main Course',
  Chicken: 'Main Course',
  Goat: 'Main Course',
  Lamb: 'Main Course',
  Pork: 'Main Course',
  Seafood: 'Main Course',
  Pasta: 'Main Course',
  Miscellaneous: 'Main Course',
  Vegan: 'Main Course',
  Vegetarian: 'Main Course'
}




const CUISINE_ALIASES = {
  
  american: 'American',
  italian: 'Italian',
  italy: 'Italian',
  chinese: 'Chinese',
  china: 'Chinese',
  japanese: 'Japanese',
  japan: 'Japanese',
  mexican: 'Mexican',
  mexico: 'Mexican',
  indian: 'Indian',
  india: 'Indian',
  thai: 'Thai',
  thailand: 'Thai',
  french: 'French',
  france: 'French',
  greek: 'Greek',
  greece: 'Greek',
  spanish: 'Spanish',
  spain: 'Spanish',
  korean: 'Korean',
  'south korean': 'Korean',
  korea: 'Korean',
  'south korea': 'Korean',
  vietnamese: 'Vietnamese',
  vietnam: 'Vietnamese',
  mediterranean: 'Mediterranean',
  canada: 'American',
  canadian: 'American',
  'united states': 'American',
  'united states of america': 'American',
  usa: 'American',
  'us': 'American',
  
  turkey: 'Middle Eastern',
  turkish: 'Middle Eastern',
  lebanon: 'Middle Eastern',
  lebanese: 'Middle Eastern',
  morocco: 'Middle Eastern',
  moroccan: 'Middle Eastern',
  egypt: 'Middle Eastern',
  egyptian: 'Middle Eastern',
  israel: 'Middle Eastern',
  israeli: 'Middle Eastern',
  palestine: 'Middle Eastern',
  palestinian: 'Middle Eastern',
  jordan: 'Middle Eastern',
  jordanian: 'Middle Eastern',
  syria: 'Middle Eastern',
  syrian: 'Middle Eastern',
  iraq: 'Middle Eastern',
  iraqi: 'Middle Eastern',
  iran: 'Middle Eastern',
  iranian: 'Middle Eastern',
  'saudi arabia': 'Middle Eastern',
  'saudi arabian': 'Middle Eastern',
  yemen: 'Middle Eastern',
  yemeni: 'Middle Eastern',
  qatar: 'Middle Eastern',
  qatari: 'Middle Eastern',
  'united arab emirates': 'Middle Eastern',
  emirati: 'Middle Eastern',
  kuwait: 'Middle Eastern',
  kuwaiti: 'Middle Eastern',
  bahrain: 'Middle Eastern',
  bahraini: 'Middle Eastern',
  algeria: 'Middle Eastern',
  algerian: 'Middle Eastern',
  tunisia: 'Middle Eastern',
  tunisian: 'Middle Eastern',
  libya: 'Middle Eastern',
  libyan: 'Middle Eastern',
  oman: 'Middle Eastern',
  omani: 'Middle Eastern'
}


const DIET_FROM_CATEGORY = {
  vegan: ['Vegan', 'Vegetarian'],
  vegetarian: ['Vegetarian']
}

const TAG_ALIASES = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  glutenfree: 'Gluten-Free',
  dairyfree: 'Dairy-Free',
  nutfree: 'Nut-Free',
  eggfree: 'Egg-Free',
  soyfree: 'Soy-Free',
  lowcarb: 'Low-Carb',
  keto: 'Keto',
  paleo: 'Paleo',
  halal: 'Halal',
  kosher: 'Kosher',
  sugarfree: 'Sugar-Free',
  lowfat: 'Low-Fat',
  highprotein: 'High-Protein'
}

const UNICODE_FRACTIONS = {
  '\u00BD': '0.5', 
  '\u00BC': '0.25', 
  '\u00BE': '0.75', 
  '\u2153': '0.3333', 
  '\u2154': '0.6667', 
  '\u215B': '0.125', 
  '\u215C': '0.375', 
  '\u215D': '0.625', 
  '\u215E': '0.875' 
}


const UNIT_MAP = {
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbsps: 'tbsp', 'tbsp.': 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', tsps: 'tsp', 'tsp.': 'tsp',
  cup: 'cups', cups: 'cups', 'c.': 'cups',
  ounce: 'oz', ounces: 'oz', oz: 'oz', 'oz.': 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  gram: 'g', grams: 'g', g: 'g', 'g.': 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', ml: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l', l: 'l',
  slice: 'slices', slices: 'slices',
  pinch: 'pinch', pinches: 'pinch',
  clove: 'clove', cloves: 'clove',
  bunch: 'bunch', bunches: 'bunch',
  handful: 'handful', handfuls: 'handful',
  whole: 'whole', pcs: 'whole', pc: 'whole',
  packet: 'packet', packets: 'packet',
  can: 'can', cans: 'can', tin: 'can', tins: 'can'
}

 
function parseAmount(input) {
  if (input == null) return null
  let norm = String(input).trim().replace(',', '')

  for (const [k, v] of Object.entries(UNICODE_FRACTIONS)) {
    norm = norm.split(k).join(v)
  }
  norm = norm.replace(/\s+/g, ' ').trim()
  if (!norm) return null

  let m = norm.match(/^\d+(?:\.\d+)?$/) 
  if (m) return Number(norm)

  m = norm.match(/^(\d+)\s*\/\s*(\d+)$/) 
  if (m) return round2(Number(m[1]) / Number(m[2]))

  m = norm.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/) 
  if (m) return round2(Number(m[1]) + Number(m[2]) / Number(m[3]))

  m = norm.match(/^(\d+)\s+(\d+(?:\.\d+)?)$/) 
  if (m) return round2(Number(m[1]) + Number(m[2]))

  m = norm.match(/^(\d+(?:\.\d+)?)\s*[-\u2013]\s*(\d+(?:\.\d+)?)$/) 
  if (m) return round2((Number(m[1]) + Number(m[2])) / 2)

  m = norm.match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?$/) 
  if (m) {
    const ratio = m[3] ? Number(m[2]) / Number(m[3]) : Number(m[2])
    return round2(Number(m[1]) * ratio)
  }

  return null
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function cleanUnit(value) {
  let s = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s) return 'whole'
  const tokens = s.split(' ')
  const first = UNIT_MAP[tokens[0]]
  if (first) {
    if (tokens.length === 1) return first
    return first + ' ' + tokens.slice(1).join(' ')
  }
  return s
}

 







function parseMeasure(measure) {
  let text = String(measure || '').trim().replace(/\s+/g, ' ')
  if (!text) return { amount: 0, unit: 'whole' }

  for (const [k, v] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.split(k).join(v)
  }
  text = text.replace(/^about\s+/i, '').trim()

  const juice = text.match(/^juice of\s+(.*)$/i)
  if (juice) {
    const inner = juice[1].trim()
    return { amount: parseAmount(inner) ?? 0, unit: 'juice of' }
  }

  const m = text.match(/^([\d.,\s/\-\u2013]+)\s*(.*)$/)
  let amount = null
  let unitRaw = text
  if (m && /[\d]/.test(m[1])) {
    amount = parseAmount(m[1].trim())
    if (amount !== null) unitRaw = m[2].trim()
  }
  if (amount === null) {
    amount = 0
    unitRaw = text
  }
  return { amount, unit: cleanUnit(unitRaw) }
}

 
function parseIngredients(meal) {
  const out = []
  for (let i = 1; i <= 20; i++) {
    const name = String(meal['strIngredient' + i] || '').trim()
    if (!name) continue
    const { amount, unit } = parseMeasure(meal['strMeasure' + i])
    out.push({ name, amount, unit })
  }

  const seen = new Set()
  return out.filter((ing) => {
    const key = `${ing.name}\u0000${ing.amount}\u0000${ing.unit}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

 






function parseSteps(instructions) {
  if (!instructions) return []
  const raw = String(instructions).replace(/\r/g, '').replace(/\t/g, ' ').trim()
  if (!raw) return []

  let steps = []
  if (/step\s*\d+/i.test(raw)) {
    const before = raw.split(/step\s*1\s*[.):]?\s*/i, 1)[0]
    steps = raw.split(/step\s*\d+\s*[.):]?\s*/i)
      .map((p) => p.trim())
      .filter(Boolean)
    const pre = String(before || '').trim()
    if (pre && pre.length > 20) steps.unshift(pre)
  } else {
    steps = raw.split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l && !/^(method|methods|instructions?|directions?|procedure|ingredients|source|serves|yield|prep(aration)?\s*time|total\s*time|cook\s*time)\s*:?[\s.]*$/i.test(l))
  }

  
  const MAX_STEP_LENGTH = 450
  const split = []
  for (const step of steps) {
    const trimmed = step.trim()
    if (trimmed.length > MAX_STEP_LENGTH) {
      const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean)
      if (sentences.length > 1) split.push(...sentences)
      else split.push(trimmed)
    } else {
      split.push(trimmed)
    }
  }
  return split.filter(Boolean)
}

function normalizeCuisine(raw) {
  const key = String(raw || '').trim().toLowerCase()
  return key && CUISINE_ALIASES[key] ? CUISINE_ALIASES[key] : 'Other'
}

function normalizeCategory(raw) {
  const key = String(raw || '').trim()
  return CATEGORY_MAP[key] || 'Other'
}

function dietaryFor(meal) {
  const tags = new Set()
  const cat = String(meal.strCategory || '').trim().toLowerCase()
  for (const tag of DIET_FROM_CATEGORY[cat] || []) tags.add(tag)

  for (const raw of String(meal.strTags || '').split(',')) {
    const key = raw.trim().toLowerCase().replace(/[\s-]/g, '')
    if (DIETARY_TAGS.includes(TAG_ALIASES[key])) tags.add(TAG_ALIASES[key])
  }
  return [...tags]
}

function inferDifficulty(stepCount, ingredientCount) {
  if (stepCount <= 3 && ingredientCount <= 8) return 'Easy'
  if (stepCount >= 10 || ingredientCount >= 18) return 'Hard'
  return 'Medium'
}

 



function buildRecipe(meal) {
  const title = String(meal.strMeal || '').trim()
  const steps = parseSteps(meal.strInstructions)
  const ingredients = parseIngredients(meal)

  if (!title) return { ok: false, reason: 'missing title' }
  if (!steps.length) return { ok: false, reason: 'missing steps' }
  if (!ingredients.length) return { ok: false, reason: 'missing ingredients' }

  const category = normalizeCategory(meal.strCategory)
  const cuisine = normalizeCuisine(meal.strCountry || meal.strArea)

  return {
    ok: true,
    recipe: {
      id: `themealdb-${meal.idMeal}`,
      title,
      description: null,
      steps,
      imageUrl: meal.strMealThumb || null,
      isGlobal: true,
      status: 'published',
      category,
      difficulty: inferDifficulty(steps.length, ingredients.length),
      cookingTime: null,
      servings: null,
      cuisine,
      dietaryTags: dietaryFor(meal),
      ingredients,
      source: meal.strSource || null
    }
  }
}

module.exports = {
  buildRecipe,
  parseMeasure,
  parseSteps,
  parseIngredients,
  normalizeCategory,
  normalizeCuisine,
  inferDifficulty,
  CATEGORY_MAP,
  CUISINE_ALIASES
}