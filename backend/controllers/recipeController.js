const prisma = require('../config/prismaClient')
const {
  SUGGESTED_CATEGORIES,
  DIFFICULTIES,
  SUGGESTED_CUISINES,
  DIETARY_TAGS
} = require('../utils/recipeConstants')

async function getAllRecipes(req, res) {
  try {
    const userId = req.user.userId

    const {
      search,
      ingredients,
      category,
      difficulty,
      cuisine,
      dietaryTags,
      maxCookingTime,
      minCookingTime,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query

    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const skip = (pageNum - 1) * limitNum

    const where = {
      OR: [
        { userId: userId },
        { isGlobal: true }
      ]
    }

    if (search && search.trim()) {
      where.AND = where.AND || []
      where.AND.push({
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } }
        ]
      })
    }

    if (ingredients && ingredients.trim()) {
      const ingredientList = ingredients.split(',').map(i => i.trim()).filter(i => i)
      if (ingredientList.length > 0) {
        where.AND = where.AND || []
        ingredientList.forEach(ingredientName => {
          where.AND.push({
            ingredients: {
              some: {
                name: { contains: ingredientName, mode: 'insensitive' }
              }
            }
          })
        })
      }
    }

    if (category && category.trim()) {
      where.category = { equals: category.trim(), mode: 'insensitive' }
    }

    if (difficulty && difficulty.trim()) {
      where.difficulty = { equals: difficulty.trim(), mode: 'insensitive' }
    }

    if (cuisine && cuisine.trim()) {
      where.cuisine = { equals: cuisine.trim(), mode: 'insensitive' }
    }

    if (dietaryTags && dietaryTags.trim()) {
      const tagList = dietaryTags.split(',').map(t => t.trim()).filter(t => t)
      if (tagList.length > 0) {
        where.AND = where.AND || []
        tagList.forEach(tag => {
          where.AND.push({
            dietaryTags: {
              has: tag
            }
          })
        })
      }
    }

    if (maxCookingTime) {
      const maxTime = parseInt(maxCookingTime)
      if (!isNaN(maxTime) && maxTime > 0) {
        where.cookingTime = { ...where.cookingTime, lte: maxTime }
      }
    }
    if (minCookingTime) {
      const minTime = parseInt(minCookingTime)
      if (!isNaN(minTime) && minTime > 0) {
        where.cookingTime = { ...where.cookingTime, gte: minTime }
      }
    }

    const validSortFields = ['createdAt', 'updatedAt', 'title', 'cookingTime']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc'
    const orderBy = { [sortField]: order }

    const total = await prisma.recipe.count({ where })

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            username: true,
            usernameOriginal: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    })

    const totalPages = Math.ceil(total / limitNum)

    res.json({
      recipes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    })
  } catch (err) {
    console.error('Get all recipes error:', err)
    res.status(500).json({ msg: 'Failed to fetch recipes' })
  }
}

async function getRecipeById(req, res) {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            username: true,
            usernameOriginal: true
          }
        }
      }
    })

    if (!recipe) {
      return res.status(404).json({ msg: 'Recipe not found' })
    }

    if (recipe.userId !== userId && !recipe.isGlobal) {
      return res.status(403).json({ msg: 'Access denied' })
    }

    res.json({ recipe })
  } catch (err) {
    console.error('Get recipe by ID error:', err)
    res.status(500).json({ msg: 'Failed to fetch recipe' })
  }
}

async function getMyRecipes(req, res) {
  try {
    const userId = req.user.userId
    const recipes = await prisma.recipe.findMany({
      where: { userId: userId },
      include: {
        ingredients: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ recipes })
  } catch (err) {
    console.error('Get my recipes error:', err)
    res.status(500).json({ msg: 'Failed to fetch your recipes' })
  }
}

async function getGlobalRecipes(req, res) {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isGlobal: true },
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            username: true,
            usernameOriginal: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ recipes })
  } catch (err) {
    console.error('Get global recipes error:', err)
    res.status(500).json({ msg: 'Failed to fetch global recipes' })
  }
}

async function createRecipe(req, res) {
  try {
    const userId = req.user.userId
    const {
      title,
      description,
      steps,
      imageUrl,
      ingredients,
      isGlobal,
      category,
      difficulty,
      cookingTime,
      servings,
      cuisine,
      dietaryTags
    } = req.body

    if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ msg: 'Title and steps are required' })
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ msg: 'At least one ingredient is required' })
    }

    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
        return res.status(400).json({ msg: 'Each ingredient must have name, amount, and unit' })
      }
    }

    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ msg: 'Difficulty must be Easy, Medium, or Hard' })
    }

    if (cookingTime !== undefined) {
      const time = parseInt(cookingTime)
      if (isNaN(time) || time < 0) {
        return res.status(400).json({ msg: 'Cooking time must be a positive number' })
      }
    }

    if (servings !== undefined) {
      const servingsNum = parseInt(servings)
      if (isNaN(servingsNum) || servingsNum < 1) {
        return res.status(400).json({ msg: 'Servings must be at least 1' })
      }
    }

    if (dietaryTags !== undefined && !Array.isArray(dietaryTags)) {
      return res.status(400).json({ msg: 'Dietary tags must be an array' })
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId: userId,
        title,
        description: description || null,
        steps,
        imageUrl: imageUrl || null,
        isGlobal: isGlobal || false,
        category: category || null,
        difficulty: difficulty || null,
        cookingTime: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        cuisine: cuisine || null,
        dietaryTags: dietaryTags || [],
        ingredients: {
          create: ingredients.map(ing => ({
            name: ing.name,
            amount: parseFloat(ing.amount),
            unit: ing.unit
          }))
        }
      },
      include: {
        ingredients: true
      }
    })

    res.status(201).json({ msg: 'Recipe created successfully', recipe })
  } catch (err) {
    console.error('Create recipe error:', err)
    res.status(500).json({ msg: 'Failed to create recipe' })
  }
}

async function updateRecipe(req, res) {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const {
      title,
      description,
      steps,
      imageUrl,
      ingredients,
      isGlobal,
      category,
      difficulty,
      cookingTime,
      servings,
      cuisine,
      dietaryTags
    } = req.body

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      return res.status(404).json({ msg: 'Recipe not found' })
    }

    if (existingRecipe.userId !== userId) {
      return res.status(403).json({ msg: 'You can only update your own recipes' })
    }

    if (difficulty !== undefined && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ msg: 'Difficulty must be Easy, Medium, or Hard' })
    }

    if (cookingTime !== undefined) {
      const time = parseInt(cookingTime)
      if (isNaN(time) || time < 0) {
        return res.status(400).json({ msg: 'Cooking time must be a positive number' })
      }
    }

    if (servings !== undefined) {
      const servingsNum = parseInt(servings)
      if (isNaN(servingsNum) || servingsNum < 1) {
        return res.status(400).json({ msg: 'Servings must be at least 1' })
      }
    }

    if (dietaryTags !== undefined && !Array.isArray(dietaryTags)) {
      return res.status(400).json({ msg: 'Dietary tags must be an array' })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (steps !== undefined) {
      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ msg: 'Steps must be a non-empty array' })
      }
      updateData.steps = steps
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (isGlobal !== undefined) updateData.isGlobal = isGlobal
    if (category !== undefined) updateData.category = category
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (cookingTime !== undefined) updateData.cookingTime = cookingTime ? parseInt(cookingTime) : null
    if (servings !== undefined) updateData.servings = servings ? parseInt(servings) : null
    if (cuisine !== undefined) updateData.cuisine = cuisine
    if (dietaryTags !== undefined) updateData.dietaryTags = dietaryTags

    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ msg: 'Ingredients must be a non-empty array' })
      }

      for (const ingredient of ingredients) {
        if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
          return res.status(400).json({ msg: 'Each ingredient must have name, amount, and unit' })
        }
      }

      await prisma.ingredient.deleteMany({
        where: { recipeId: id }
      })

      updateData.ingredients = {
        create: ingredients.map(ing => ({
          name: ing.name,
          amount: parseFloat(ing.amount),
          unit: ing.unit
        }))
      }
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        ingredients: true
      }
    })

    res.json({ msg: 'Recipe updated successfully', recipe: updatedRecipe })
  } catch (err) {
    console.error('Update recipe error:', err)
    res.status(500).json({ msg: 'Failed to update recipe' })
  }
}

async function deleteRecipe(req, res) {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      return res.status(404).json({ msg: 'Recipe not found' })
    }

    if (existingRecipe.userId !== userId) {
      return res.status(403).json({ msg: 'You can only delete your own recipes' })
    }

    await prisma.recipe.delete({
      where: { id }
    })

    res.json({ msg: 'Recipe deleted successfully' })
  } catch (err) {
    console.error('Delete recipe error:', err)
    res.status(500).json({ msg: 'Failed to delete recipe' })
  }
}

async function getRecipeMetadata(req, res) {
  try {
    const userId = req.user.userId

    const accessWhere = {
      OR: [
        { userId: userId },
        { isGlobal: true }
      ]
    }

    const [dbCategories, dbCuisines, dbDietaryTags, dbDifficulties] = await Promise.all([
      prisma.recipe.findMany({
        where: { ...accessWhere, category: { not: null } },
        select: { category: true },
        distinct: ['category']
      }),
      prisma.recipe.findMany({
        where: { ...accessWhere, cuisine: { not: null } },
        select: { cuisine: true },
        distinct: ['cuisine']
      }),
      prisma.recipe.findMany({
        where: accessWhere,
        select: { dietaryTags: true }
      }),
      prisma.recipe.findMany({
        where: { ...accessWhere, difficulty: { not: null } },
        select: { difficulty: true },
        distinct: ['difficulty']
      })
    ])

    const dietaryTagSet = new Set()
    dbDietaryTags.forEach(r => {
      if (Array.isArray(r.dietaryTags)) {
        r.dietaryTags.forEach(tag => dietaryTagSet.add(tag))
      }
    })

    const categories = [...new Set([
      ...SUGGESTED_CATEGORIES,
      ...dbCategories.map(r => r.category).filter(Boolean)
    ])]

    const cuisines = [...new Set([
      ...SUGGESTED_CUISINES,
      ...dbCuisines.map(r => r.cuisine).filter(Boolean)
    ])]

    const difficulties = [...new Set([
      ...DIFFICULTIES,
      ...dbDifficulties.map(r => r.difficulty).filter(Boolean)
    ])]

    const dietaryTags = [...new Set([
      ...DIETARY_TAGS,
      ...dietaryTagSet
    ])]

    res.json({
      categories,
      cuisines,
      difficulties,
      dietaryTags
    })
  } catch (err) {
    console.error('Get recipe metadata error:', err)
    res.status(500).json({ msg: 'Failed to fetch recipe metadata' })
  }
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  getMyRecipes,
  getGlobalRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeMetadata
}
