const prisma = require('../config/prismaClient')

const USER_SELECT = {
  id: true,
  username: true,
  usernameOriginal: true
}

function serializeEdit(edit) {
  return {
    ...edit,
    ingredients: Array.isArray(edit.ingredients) ? edit.ingredients : []
  }
}

function validateEditPayload(body) {
  const {
    title,
    description,
    steps,
    imageUrl,
    ingredients,
    category,
    difficulty,
    cookingTime,
    servings,
    cuisine,
    dietaryTags
  } = body

  if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
    return { error: 'Title and steps are required' }
  }

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return { error: 'At least one ingredient is required' }
  }

  for (const ingredient of ingredients) {
    if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
      return { error: 'Each ingredient must have name, amount, and unit' }
    }
  }

  if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return { error: 'Difficulty must be Easy, Medium, or Hard' }
  }

  if (cookingTime !== undefined && cookingTime !== null) {
    const time = parseInt(cookingTime)
    if (isNaN(time) || time < 0) {
      return { error: 'Cooking time must be a positive number' }
    }
  }

  if (servings !== undefined && servings !== null) {
    const servingsNum = parseInt(servings)
    if (isNaN(servingsNum) || servingsNum < 1) {
      return { error: 'Servings must be at least 1' }
    }
  }

  if (dietaryTags !== undefined && !Array.isArray(dietaryTags)) {
    return { error: 'Dietary tags must be an array' }
  }

  return {
    data: {
      title,
      description: description || null,
      steps,
      imageUrl: imageUrl || null,
      category: category || null,
      difficulty: difficulty || null,
      cookingTime: cookingTime ? parseInt(cookingTime) : null,
      servings: servings ? parseInt(servings) : null,
      cuisine: cuisine || null,
      dietaryTags: dietaryTags || [],
      ingredients: ingredients.map((ing) => ({
        name: ing.name,
        amount: parseFloat(ing.amount),
        unit: ing.unit
      }))
    }
  }
}

async function submitRecipeEdit(req, res) {
  try {
    const { id: recipeId } = req.params
    const userId = req.user.userId

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ msg: 'Recipe not found' })
    }
    if (recipe.userId !== userId) {
      return res.status(403).json({ msg: 'You can only edit your own recipes' })
    }

    const validated = validateEditPayload(req.body)
    if (validated.error) {
      return res.status(400).json({ msg: validated.error })
    }

    const existingPending = await prisma.recipeEdit.findFirst({
      where: { recipeId, status: 'pending' }
    })

    let edit
    if (existingPending) {
      edit = await prisma.recipeEdit.update({
        where: { id: existingPending.id },
        data: {
          ...validated.data,
          rejectedReason: null,
          reviewedAt: null
        }
      })
    } else {
      edit = await prisma.recipeEdit.create({
        data: {
          recipeId,
          userId,
          status: 'pending',
          ...validated.data
        }
      })
    }

    res.json({ msg: 'Edit submitted for review', edit: serializeEdit(edit) })
  } catch (err) {
    console.error('Submit recipe edit error:', err)
    res.status(500).json({ msg: 'Failed to submit recipe edit' })
  }
}

async function getPendingRecipeEdit(req, res) {
  try {
    const { id: recipeId } = req.params
    const userId = req.user.userId

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ msg: 'Recipe not found' })
    }
    if (recipe.userId !== userId) {
      return res.status(403).json({ msg: 'Access denied' })
    }

    const edit = await prisma.recipeEdit.findFirst({
      where: { recipeId, status: 'pending' }
    })

    res.json({ edit: edit ? serializeEdit(edit) : null })
  } catch (err) {
    console.error('Get pending recipe edit error:', err)
    res.status(500).json({ msg: 'Failed to fetch pending edit' })
  }
}

module.exports = {
  submitRecipeEdit,
  getPendingRecipeEdit,
  serializeEdit,
  validateEditPayload,
  USER_SELECT
}
