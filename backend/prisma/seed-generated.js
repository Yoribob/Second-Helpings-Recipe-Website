#!/usr/bin/env node
 









try {
  require('dotenv/config')
} catch {
   
}

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { validateRecipe } = require('../utils/recipeValidator')

const prisma = new PrismaClient()
const DEFAULT_DIR = path.resolve(process.cwd(), 'prisma', 'generated')

function loadFiles(files) {
  const inputs = files.length ? files : (fs.existsSync(DEFAULT_DIR) ? fs.readdirSync(DEFAULT_DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(DEFAULT_DIR, f)) : [])
  const recipes = []
  for (const file of inputs) {
    if (!fs.existsSync(file)) throw new Error(`file not found: ${file}`)
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    const list = Array.isArray(data) ? data : Array.isArray(data.recipes) ? data.recipes : null
    if (!list) throw new Error(`no recipes array found in ${file}`)
    for (const r of list) {
      const check = validateRecipe(r)
      if (!check.ok) {
        console.warn(`skip invalid in ${file}: ${r && r.title} — ${check.errors.join('; ')}`)
        continue
      }
      if (!r.id) throw new Error(`recipe missing id in ${file}: ${r.title}`)
      recipes.push(r)
    }
  }
  return recipes
}

async function seed(recipes) {
  let created = 0
  let updated = 0
  let errors = 0
  for (const r of recipes) {
    const { id, ingredients, ...rest } = r
    const data = {
      title: rest.title,
      description: rest.description ?? null,
      steps: rest.steps,
      imageUrl: null,
      isGlobal: true,
      status: 'published',
      category: rest.category ?? null,
      difficulty: rest.difficulty ?? null,
      cookingTime: rest.cookingTime ?? null,
      servings: rest.servings ?? null,
      cuisine: rest.cuisine ?? null,
      dietaryTags: rest.dietaryTags ?? []
    }
    try {
      const exists = await prisma.recipe.findUnique({ where: { id } })
      await prisma.recipe.upsert({
        where: { id },
        update: { ...data, ingredients: { deleteMany: {}, create: ingredients } },
        create: { id, userId: null, ...data, ingredients: { create: ingredients } }
      })
      if (exists) updated++
      else created++
    } catch (err) {
      errors++
      console.error(`  upsert error for ${id} (${rest.title}): ${err.message}`)
    }
  }
  return { created, updated, errors }
}

(async () => {
  const files = process.argv.slice(2)
  console.log(files.length ? `Importing ${files.length} file(s)…` : `Importing all JSON files from ${DEFAULT_DIR}…`)
  const recipes = loadFiles(files)
  console.log(`Loaded ${recipes.length} recipes.`)
  if (!recipes.length) return
  const res = await seed(recipes)
  const total = await prisma.recipe.count()
  console.log(`Seeded. Created ${res.created}, updated ${res.updated}, errors ${res.errors}. Total recipes in DB: ${total}.`)
})().then(
  () => prisma.$disconnect().catch(() => {}),
  async (err) => {
    console.error('Import failed:', err)
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
)