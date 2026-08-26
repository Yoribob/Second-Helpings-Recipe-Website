#!/usr/bin/env node
 



























try {
  require('dotenv/config')
} catch {
  
}

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { buildRecipe } = require('../utils/mealdb')

const prisma = new PrismaClient()

const API_KEY = process.env.MEALDB_KEY || '1'
const BASE = `https://www.themealdb.com/api/json/v1/${API_KEY}/`
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function parseArgs(argv) {
  const args = { dryRun: false, limit: null, out: 'prisma/mealdb-preview.json', verbose: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run' || argv[i] === '--preview') args.dryRun = true
    if (argv[i] === '--verbose') args.verbose = true
    if (argv[i] === '--limit') args.limit = parseInt(argv[i + 1]) || null
    if (argv[i] === '--out') args.out = argv[i + 1]
  }
  return args
}

async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    if (attempt >= retries) throw new Error(`HTTP ${res.status} for ${url}`)
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
  }
}

async function fetchAllMeals() {
  const meals = new Map()
  for (const letter of LETTERS) {
    const url = `${BASE}search.php?f=${letter}`
    try {
      const data = await fetchWithRetry(url)
      for (const meal of data.meals || []) meals.set(String(meal.idMeal), meal)
      await new Promise((r) => setTimeout(r, 120))
    } catch (err) {
      console.warn(`  warning: ${err.message}`)
    }
  }
  return [...meals.values()]
}

function stripDerived(recipe) {
  
  const { source, ingredients, ...rest } = recipe
  void source
  return { ...rest, ingredients }
}

(async () => {
  const args = parseArgs(process.argv.slice(2))

  console.log(`Fetching TheMealDB meals (key=${API_KEY})…`)
  const meals = await fetchAllMeals()
  console.log(`Fetched ${meals.length} unique meals.`)

  const normalized = []
  const skipped = []
  const warnings = []

  for (const meal of meals) {
    const result = buildRecipe(meal)
    if (!result.ok) {
      skipped.push({ id: meal.idMeal, title: meal.strMeal, reason: result.reason })
      continue
    }
    if (!result.recipe.steps.length || !result.recipe.ingredients.length) {
      skipped.push({ id: meal.idMeal, title: meal.strMeal, reason: 'empty steps/ingredients after parse' })
      continue
    }
    normalized.push(result.recipe)
  }

  console.log(`Normalized ${normalized.length} recipes; skipped ${skipped.length}.`)

  if (skipped.length) {
    console.log('Skipped:')
    skipped.slice(0, 15).forEach((s) => console.log(`  - ${s.id} ${s.title || '(no title)'} - ${s.reason}`))
    if (skipped.length > 15) console.log(`  … and ${skipped.length - 15} more`)
  }

  if (args.dryRun) {
    const outPath = path.resolve(process.cwd(), args.out)
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        { generatedAt: new Date().toISOString(), count: normalized.length, source: 'TheMealDB', recipes: normalized },
        null,
        2
      )
    )
    console.log(`Preview written to ${outPath}`)

    console.log('\nSample entries:')
    normalized.slice(0, 3).forEach((r) => {
      console.log(JSON.stringify(
        { id: r.id, title: r.title, category: r.category, cuisine: r.cuisine, difficulty: r.difficulty, tags: r.dietaryTags, steps: r.steps.length, ingredients: r.ingredients },
        null,
        2
      ))
    })
    return
  }

  const limit = args.limit
  let created = 0
  let updated = 0
  let errors = 0

  for (let i = 0; i < normalized.length; i++) {
    if (limit && i >= limit) break
    const recipe = normalized[i]
    const data = stripDerived(recipe)

    try {
      const existing = await prisma.recipe.findUnique({ where: { id: recipe.id } })
      await prisma.recipe.upsert({
        where: { id: recipe.id },
        update: {
          ...data,
          ingredients: { deleteMany: {}, create: recipe.ingredients }
        },
        create: {
          id: recipe.id,
          userId: null,
          ...data,
          ingredients: { create: recipe.ingredients }
        }
      })
      if (existing) updated++
      else created++
    } catch (err) {
      errors++
      warnings.push({ id: recipe.id, message: err.message })
    }

    if (args.verbose) console.log(`  [${i + 1}/${normalized.length}] ${recipe.id} - ${recipe.title}`)
    else if ((i + 1) % 100 === 0) console.log(`  processed ${i + 1}/${normalized.length}…`)
  }

  const total = await prisma.recipe.count()
  console.log(`Done. Created ${created}, updated ${updated}, errors ${errors}. Total recipes in DB: ${total}.`)
  if (warnings.length) {
    console.log('Errors:')
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w.id} - ${w.message}`))
  }
})().then(
  () => prisma.$disconnect(),
  async (err) => {
    console.error('Import failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  }
)