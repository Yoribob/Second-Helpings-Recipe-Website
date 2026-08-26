#!/usr/bin/env node
 


















try {
  require('dotenv/config')
} catch {
   
}

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { validateRecipe, sanitizeVocab, DIETARY_TAGS } = require('../utils/recipeValidator')

const prisma = new PrismaClient()

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
const API_BASE = `https://generativelanguage.googleapis.com/v1beta/models`




function parseArgs(argv) {
  const a = { model: MODEL, count: 5, minCategory: 5, minCuisine: 5, minTag: 4, batch: 6, out: 'prisma/generated', targets: [], inspect: false, dryRun: false, verbose: false, maxRecipes: null }
  for (let i = 0; i < argv.length; i++) {
    const v = (k) => argv[i + 1]
    switch (argv[i]) {
      case '--model': a.model = v(0); i++; break
      case '--key': a.key = v(0); i++; break
      case '--count': a.count = parseInt(v(0)) || 5; i++; break
      case '--min-category': a.minCategory = parseInt(v(0)) || 5; i++; break
      case '--min-cuisine': a.minCuisine = parseInt(v(0)) || 5; i++; break
      case '--min-tag': a.minTag = parseInt(v(0)) || 4; i++; break
      case '--batch': a.batch = Math.max(1, parseInt(v(0)) || 6); i++; break
      case '--out': a.out = v(0); i++; break
      case '--max-recipes': a.maxRecipes = parseInt(v(0)) || null; i++; break
      case '--targets': a.targets.push(v(0)); i++; break
      case '--inspect': a.inspect = true; break
      case '--dry-run': a.dryRun = true; break
      case '--verbose': a.verbose = true; break
      default: break
    }
  }
  return a
}




async function loadCounts() {
  const cat = {}
  ;(await prisma.recipe.groupBy({ by: ['category'], where: { category: { not: null } }, _count: true }))
    .forEach((r) => (cat[r.category] = r._count))
  const cui = {}
  ;(await prisma.recipe.groupBy({ by: ['cuisine'], where: { cuisine: { not: null } }, _count: true }))
    .forEach((r) => (cui[r.cuisine] = r._count))

  const tag = {}
  const recs = await prisma.recipe.findMany({ select: { dietaryTags: true } })
  recs.forEach((r) => r.dietaryTags.forEach((t) => (tag[t] = (tag[t] || 0) + 1)))

  return { category: cat, cuisine: cui, dietaryTags: tag }
}

function parseTargetString(str) {
  const out = {}
  for (const kv of String(str).split(';')) {
    const [k, val] = kv.split(':').map((s) => s.trim())
    if (!k || !val) continue
    if (k === 'count') out.count = parseInt(val) || 1
    else if (k === 'tags' || k === 'dietaryTags') out.dietaryTags = val.split(',').map((s) => s.trim()).filter(Boolean)
    else if (k === 'difficulty') out.difficulty = val
    else out[k] = val
  }
  if (!out.count) out.count = 5
  return { ...out, count: out.count }
}

function buildPlan(counts, args) {
  const targets = []
  const add = (t) => targets.push(t)

  for (const key of require('../utils/recipeConstants').SUGGESTED_CATEGORIES) {
    const have = counts.category[key] || 0
    if (have < args.minCategory) add({ category: key, count: args.minCategory - have })
  }
  for (const key of require('../utils/recipeConstants').SUGGESTED_CUISINES) {
    const have = counts.cuisine[key] || 0
    if (have < args.minCuisine) add({ cuisine: key, count: args.minCuisine - have })
  }
  for (const key of DIETARY_TAGS) {
    const have = counts.dietaryTags[key] || 0
    if (have < args.minTag) add({ dietaryTags: [key], count: args.minTag - have })
  }

  for (const str of args.targets || []) add(parseTargetString(str))

  
  const merged = new Map()
  for (const t of targets) {
    const key = JSON.stringify([t.category || null, t.cuisine || null, (t.dietaryTags || []).slice().sort(), t.difficulty || null])
    const prev = merged.get(key)
    merged.set(key, prev ? { ...prev, count: Math.max(prev.count, t.count) } : t)
  }

  return [...merged.values()]
}




function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function callGemini(model, apiKey, systemPrompt, userPrompt) {
  const url = `${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 8192 }
  }

  const TIMEOUT_MS = 120000
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof text !== 'string' || !text.trim()) {
          throw new Error('model returned no text (finish reason: ' + JSON.stringify(data.candidates?.[0]?.finishReason) + ')')
        }
        return text
      }
      lastErr = new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text().catch(() => '')}`)
      if (res.status === 400) break 
    } catch (err) {
      lastErr = err
      if (err.name === 'AbortError') lastErr = new Error(`request timed out after ${TIMEOUT_MS / 1000}s`)
    } finally {
      clearTimeout(timer)
    }
    await sleep(1500 * (attempt + 1))
  }
  throw lastErr
}

function extractJsonArray(text) {
  let t = String(text || '').trim()
  
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('[')
  const objStart = t.indexOf('{')
  if (start === -1 && objStart === -1) throw new Error('no JSON array/object found in model output')
  let from
  if (start === -1) from = objStart
  else if (objStart === -1) from = start
  else from = Math.min(start, objStart)
  const slice = t.slice(from)
  return JSON.parse(slice)
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}




const SYSTEM_PROMPT = `You are a professional, meticulous recipe writer.

Rules:
- Write original, realistic, cookable recipes with precise measurements.
- You may base a dish on a classic, but write your own title and instructions.
- Every recipe MUST only use the exact allowed values provided below for category,
  difficulty, cuisine and dietaryTags. If a required value is not allowed, invent
  nothing - use one from the allowed lists.
- Ingredient amounts: use numeric amounts with a real unit. Amount 0 is allowed only
  for seasoning style entries like "to taste", "for frying", "pinch" (keep the unit
  descriptive in that case).
- cookingTime = total active+inactive minutes (integer). servings = integer 1-12.
- description = one short appetizing sentence.
- steps = 3-8 clear numbered steps, each a complete sentence.
- dietaryTags must be consistent with the ingredients (e.g. Gluten-Free recipes must
  not use wheat; Vegan must contain no animal products; Halal no pork/alcohol; Kosher
  no mixing of meat and dairy; Sugar-Free no added sugar; Low-Carb minimal carbs;
  High-Protein packs protein).
- Return ONLY valid JSON. No markdown, no commentary.`

function targetLine(t) {
  const parts = []
  if (t.category) parts.push(`CATEGORY = "${t.category}" (all recipes must use exactly this value)`)
  if (t.cuisine) parts.push(`CUISINE = "${t.cuisine}" (all recipes must use exactly this value)`)
  if (t.difficulty) parts.push(`DIFFICULTY = "${t.difficulty}" (all recipes must use exactly this value)`)
  if (t.dietaryTags && t.dietaryTags.length) parts.push(`DIETARY TAGS = [${t.dietaryTags.map((x) => `"${x}"`).join(', ')}] (every recipe MUST include ALL of these tags, and ingredients must genuinely match them)`)
  return parts.join('\n')
}

function buildPrompt(target, count, allowed) {
  const lines = []
  lines.push(`Generate exactly ${count} distinct recipes as a JSON array.`)
  lines.push('')
  lines.push('Constraints for this batch (strictly obey):')
  lines.push(targetLine(target))
  if (!target.category) lines.push('CATEGORY: pick a fitting value from: ' + allowed.categories.join(', '))
  if (!target.cuisine) lines.push('CUISINE: pick a fitting value from: ' + allowed.cuisines.join(', '))
  lines.push('DIFFICULTY: pick from: Easy, Medium, Hard')
  lines.push('DIETARY TAGS: add 0-3 tags from: ' + allowed.tags.join(', '))
  if (target.category === 'Other') lines.push('Note: "Other" = dishes that do not fit the other categories (e.g. sauces, condiments, spice blends, preserves).')
  if (target.category === 'Drink') lines.push('Note: "Drink" = beverages (smoothies, shakes, iced teas, non-alcoholic drinks).')
  lines.push('')
  lines.push('Return JSON in exactly this shape:')
  lines.push(`[{"title":"...","description":"...","steps":["step 1","step 2"],"ingredients":[{"name":"olive oil","amount":2,"unit":"tbsp"}],"category":"...","difficulty":"Easy","cookingTime":30,"servings":4,"cuisine":"...","dietaryTags":["..."]}]`)
  return lines.join('\n')
}




async function generateTarget(model, apiKey, target, args, allowed, usedIds, existingTitles) {
  const recipes = []
  const batches = Math.ceil(target.count / args.batch)
  const wantEach = Math.ceil(target.count / batches)

  for (let b = 0; b < batches; b++) {
    const need = target.count - recipes.length
    if (need <= 0) break
    const batchSize = Math.min(args.batch, need)
    const prompt = buildPrompt(target, batchSize, allowed)

    let attempts = 0
    let ok = false
    while (!ok && attempts < 4) {
      attempts++
      try {
        const t0 = Date.now()
        console.log(`    requesting ${batchSize} recipe(s) from ${model}…`)
        const raw = await callGemini(model, apiKey, SYSTEM_PROMPT, prompt)
        console.log(`    model replied in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
        let arr = extractJsonArray(raw)
        if (!Array.isArray(arr)) {
          const unwrapped = arr && typeof arr === 'object' && Array.isArray(arr.recipes) ? arr.recipes : null
          if (!unwrapped) throw new Error('model returned a non-array, non-{recipes} payload')
          arr = unwrapped
        }
        for (const cand of arr) {
          if (recipes.length >= target.count) break
          const cleaned = sanitizeVocab(cand)
          const check = validateRecipe(cleaned)
          if (!check.ok) {
            if (args.verbose) console.log(`  reject (${check.errors.join('; ')}): ${cand && cand.title}`)
            continue
          }
          if (!conformsToTarget(cleaned, target)) continue
          if (usedIdsHas(cleaned.title, usedIds) || isDuplicateTitle(cleaned.title, recipes, existingTitles)) {
            if (args.verbose) console.log(`  skip duplicate-ish title: ${cleaned.title}`)
            continue
          }
          const id = uniqueId(slugify(cleaned.title), usedIds)
          usedIds.add(id)
          recipes.push({ id, ...cleaned })
        }
        ok = true
      } catch (err) {
        if (args.verbose) console.log(`  attempt ${attempts} failed: ${err.message}`)
        await sleep(1500 * attempts)
      }
    }
    if (args.verbose) console.log(`  batch ${b + 1}/${batches}: got ${recipes.length}/${target.count} so far`)
  }

  return recipes
}

function conformsToTarget(r, t) {
  if (t.category && r.category !== t.category) return false
  if (t.cuisine && r.cuisine !== t.cuisine) return false
  if (t.difficulty && r.difficulty !== t.difficulty) return false
  if (t.dietaryTags && t.dietaryTags.length) {
    for (const tag of t.dietaryTags) if (!r.dietaryTags.includes(tag)) return false
  }
  return true
}

function usedIdsHas(title, usedIds) {
  const slug = slugify(title)
  return usedIds.has(slug)
}

function isDuplicateTitle(title, list, existingTitles) {
  const low = title.toLowerCase().trim()
  if (existingTitles.has(low)) return true
  return list.some((r) => r.title.toLowerCase() === low)
}

function uniqueId(base, usedIds) {
  let id = base
  let n = 2
  while (usedIds.has(id)) {
    id = `${base}-${n++}`
  }
  return id
}




async function seedRecipes(recipes) {
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
  const args = parseArgs(process.argv.slice(2))
  const apiKey = args.key || process.env.GEMINI_API_KEY

  console.log('\nLayer 2 recipe generator')
  console.log('=======================')

  const counts = await loadCounts()
  const plan = buildPlan(counts, args)
  const totalNeeded = plan.reduce((s, t) => s + t.count, 0)

  console.log('Coverage (recipes per value):')
  for (const field of ['category', 'cuisine']) {
    const vocab = require('../utils/recipeConstants')[field === 'category' ? 'SUGGESTED_CATEGORIES' : 'SUGGESTED_CUISINES']
    console.log(`  ${field}: ${vocab.map((v) => `${v}=${counts[field][v] || 0}`).join(', ')}`)
  }
  console.log('  dietaryTags: ' + DIETARY_TAGS.map((t) => `${t}=${counts.dietaryTags[t] || 0}`).join(', '))

  console.log(`Plan: ${plan.length} targets, ${totalNeeded} recipes to generate.`)
  for (const t of plan) {
    const label =
      (t.category ? `category=${t.category}` : '') +
      (t.cuisine ? (t.category ? ', ' : '') + `cuisine=${t.cuisine}` : '') +
      (t.dietaryTags ? (t.category || t.cuisine ? ', ' : '') + `tags=[${t.dietaryTags.join(',')}]` : '') +
      (t.difficulty ? (t.category || t.cuisine || t.dietaryTags ? ', ' : '') + `difficulty=${t.difficulty}` : '')
    console.log(`  - ${label || '(any)'} × ${t.count}`)
  }

  if (args.inspect) {
    console.log('\n(plan only - re-run without --inspect to generate)')
    return
  }

  if (!apiKey) {
    console.error('\nERROR: GEMINI_API_KEY is not set.')
    console.error('Get a free key at https://aistudio.google.com (no credit card), then add it to backend/.env as GEMINI_API_KEY=...')
    process.exit(1)
  }

  if (args.maxRecipes) {
    let budget = args.maxRecipes
    for (const t of plan) {
      t.count = Math.min(t.count, budget)
      budget -= t.count
      if (budget <= 0) break
    }
  }

  const rc = require('../utils/recipeConstants')
  const allowed = {
    categories: rc.SUGGESTED_CATEGORIES,
    cuisines: rc.SUGGESTED_CUISINES,
    tags: rc.DIETARY_TAGS,
    difficulties: rc.DIFFICULTIES
  }
  const usedIds = new Set((await prisma.recipe.findMany({ select: { id: true } })).map((r) => r.id))
  const existingTitles = new Set((await prisma.recipe.findMany({ select: { title: true } })).map((r) => r.title.toLowerCase()))

  const outDir = path.resolve(process.cwd(), args.out)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const all = []
  let callErrors = 0

  for (const target of plan) {
    const label =
      (target.category ? `category-${target.category}` : '') +
      (target.cuisine ? (target.category ? '-' : '') + `cuisine-${target.cuisine}` : '') +
      (target.dietaryTags ? (target.category || target.cuisine ? '-' : '') + `tags-${target.dietaryTags.join('+')}` : '')
    console.log(`\nGenerating ${target.count} for ${label || 'any'}…`)
    try {
      const recipes = await generateTarget(args.model, apiKey, target, args, allowed, usedIds, existingTitles)
      console.log(`  generated ${recipes.length}/${target.count}`)
      if (recipes.length) {
        all.push(...recipes)
        const file = path.join(outDir, `${slugify(label) || 'target'}.json`)
        fs.writeFileSync(file, JSON.stringify({ generatedAt: new Date().toISOString(), target, recipes }, null, 2))
        recipes.forEach((r) => existingTitles.add(r.title.toLowerCase()))
      }
    } catch (err) {
      callErrors++
      console.error(`  target failed: ${err.message}`)
    }
    await sleep(400)
  }

  if (!all.length) {
    console.warn('\nNo recipes were generated. Check the API key/model and try again.')
    if (callErrors) console.warn(`(${callErrors} target(s) failed with errors above)`)
    return
  }

  const combined = path.join(outDir, 'all.json')
  fs.writeFileSync(combined, JSON.stringify({ generatedAt: new Date().toISOString(), count: all.length, recipes: all }, null, 2))
  console.log(`\nSaved ${all.length} recipes to ${outDir}`)

  if (args.dryRun) {
    console.log('dry-run: not writing to the database.')
    return
  }

  const res = await seedRecipes(all)
  console.log(`Seeded. Created ${res.created}, updated ${res.updated}, errors ${res.errors}.`)

  const after = await loadCounts()
  console.log('\nCoverage after:')
  for (const field of ['category', 'cuisine']) {
    const vocab = require('../utils/recipeConstants')[field === 'category' ? 'SUGGESTED_CATEGORIES' : 'SUGGESTED_CUISINES']
    console.log(`  ${field}: ${vocab.map((v) => `${v}=${after[field][v] || 0}`).join(', ')}`)
  }
  console.log('  dietaryTags: ' + DIETARY_TAGS.map((t) => `${t}=${after.dietaryTags[t] || 0}`).join(', '))
  const total = await prisma.recipe.count()
  console.log(`Total recipes in DB: ${total}`)
})().then(
  () => prisma.$disconnect().catch(() => {}),
  async (err) => {
    console.error('Generator failed:', err)
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
)