 








const {
  SUGGESTED_CATEGORIES,
  DIFFICULTIES,
  SUGGESTED_CUISINES,
  DIETARY_TAGS
} = require('./recipeConstants')

const CATEGORY_SET = new Set(SUGGESTED_CATEGORIES)
const DIFFICULTY_SET = new Set(DIFFICULTIES)
const CUISINE_SET = new Set(SUGGESTED_CUISINES)
const TAG_SET = new Set(DIETARY_TAGS)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
const isNonNegativeNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0

 



function validateRecipe(r) {
  const errors = []

  if (!r || typeof r !== 'object') {
    return { ok: false, errors: ['recipe must be an object'] }
  }

  if (!isNonEmptyString(r.title)) errors.push('title: required non-empty string')
  else if (r.title.trim().length > 200) errors.push('title: keep under 200 chars')

  if (r.description != null && !isNonEmptyString(r.description)) {
    errors.push('description: must be a non-empty string or null')
  }

  if (!Array.isArray(r.steps) || r.steps.length === 0) {
    errors.push('steps: required non-empty array')
  } else {
    r.steps.forEach((s, i) => {
      if (!isNonEmptyString(s)) errors.push(`steps[${i}]: non-empty string required`)
    })
  }

  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
    errors.push('ingredients: required non-empty array')
  } else {
    r.ingredients.forEach((ing, i) => {
      if (!ing || typeof ing !== 'object') {
        errors.push(`ingredients[${i}]: object required`)
        return
      }
      if (!isNonEmptyString(ing.name)) errors.push(`ingredients[${i}].name: required non-empty string`)
      if (!isNonNegativeNumber(ing.amount)) errors.push(`ingredients[${i}].amount: finite number >= 0 required`)
      if (!isNonEmptyString(ing.unit)) errors.push(`ingredients[${i}].unit: required non-empty string`)
    })
  }

  if (r.category != null && !CATEGORY_SET.has(r.category)) {
    errors.push(`category: "${r.category}" is not in allowed categories`)
  }
  if (r.difficulty != null && !DIFFICULTY_SET.has(r.difficulty)) {
    errors.push(`difficulty: "${r.difficulty}" is not in allowed difficulties`)
  }
  if (r.cuisine != null && !CUISINE_SET.has(r.cuisine)) {
    errors.push(`cuisine: "${r.cuisine}" is not in allowed cuisines`)
  }

  if (r.dietaryTags != null) {
    if (!Array.isArray(r.dietaryTags)) {
      errors.push('dietaryTags: must be an array')
    } else {
      r.dietaryTags.forEach((t) => {
        if (!TAG_SET.has(t)) errors.push(`dietaryTags: "${t}" is not in allowed tags`)
      })
    }
  }

  if (r.cookingTime != null && (!Number.isInteger(r.cookingTime) || r.cookingTime < 1 || r.cookingTime > 1440)) {
    errors.push('cookingTime: integer minutes 1..1440 or null')
  }
  if (r.servings != null && (!Number.isInteger(r.servings) || r.servings < 1 || r.servings > 50)) {
    errors.push('servings: integer 1..50 or null')
  }

  return { ok: errors.length === 0, errors }
}

 
function sanitizeVocab(r) {
  if (!r || typeof r !== 'object') return null
  const out = { ...r }
  if (out.category != null && CATEGORY_SET.has(out.category)) out.category = out.category
  else if (out.category != null) out.category = null
  if (out.difficulty != null && DIFFICULTY_SET.has(out.difficulty)) out.difficulty = out.difficulty
  else if (out.difficulty != null) out.difficulty = 'Medium'
  if (out.cuisine != null && CUISINE_SET.has(out.cuisine)) out.cuisine = out.cuisine
  else if (out.cuisine != null) out.cuisine = 'Other'
  if (Array.isArray(out.dietaryTags)) out.dietaryTags = out.dietaryTags.filter((t) => TAG_SET.has(t))
  return out
}

module.exports = {
  validateRecipe,
  sanitizeVocab,
  CATEGORY_SET,
  DIFFICULTY_SET,
  CUISINE_SET,
  TAG_SET,
  SUGGESTED_CATEGORIES,
  DIFFICULTIES,
  SUGGESTED_CUISINES,
  DIETARY_TAGS
}