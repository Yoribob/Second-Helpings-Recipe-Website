const prisma = require('../config/prismaClient')

const VALID_STATUSES = ['draft', 'pending', 'published', 'rejected']

const USER_SELECT = {
  id: true,
  username: true,
  usernameOriginal: true
}

function toAdminRecipe(recipe) {
  return {
    ...recipe,
    madeByUser: Boolean(recipe.userId),
    rating: null,
    myRating: null,
    comments: []
  }
}

async function getRecipesByStatus(req, res) {
  try {
    const { status = 'pending' } = req.query

    if (status !== 'all' && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        msg: `Status must be one of: ${VALID_STATUSES.join(', ')} or all`
      })
    }

    const where = { userId: { not: null } }
    if (status !== 'all') where.status = status
    where.NOT = {
      edits: { some: { status: 'pending' } }
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: true,
        user: { select: USER_SELECT }
      },
      orderBy: [{ reviewedAt: 'asc' }, { createdAt: 'asc' }]
    })

    res.json({ recipes: recipes.map(toAdminRecipe) })
  } catch (err) {
    console.error('Get admin recipes error:', err)
    res.status(500).json({ msg: 'Failed to fetch recipes' })
  }
}

async function getRecipeAndVerify(recipeId, allowedStatuses, missingMsg, wrongStatusMsg) {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
  if (!recipe) {
    const err = new Error(missingMsg)
    err.status = 404
    throw err
  }
  if (!allowedStatuses.includes(recipe.status)) {
    const err = new Error(wrongStatusMsg)
    err.status = 400
    throw err
  }
  return recipe
}

async function fetchFullRecipe(recipeId) {
  return prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: true,
      user: { select: USER_SELECT }
    }
  })
}

async function approveRecipe(req, res) {
  try {
    const { id } = req.params
    const recipe = await getRecipeAndVerify(
      id,
      ['pending'],
      'Recipe not found',
      'Only pending recipes can be approved'
    )

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        isGlobal: true,
        status: 'published',
        rejectedReason: null,
        reviewedAt: new Date()
      }
    })

    if (updated.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          recipeId: updated.id,
          type: 'approved',
          message: `Your recipe "${updated.title}" is now live and visible to everyone.`
        }
      })
    }

    const full = await fetchFullRecipe(id)
    res.json({ msg: 'Recipe approved and published', recipe: toAdminRecipe(full) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ msg: err.message })
    console.error('Approve recipe error:', err)
    res.status(500).json({ msg: 'Failed to approve recipe' })
  }
}

async function rejectRecipe(req, res) {
  try {
    const { id } = req.params
    const reason = String(req.body.reason || '').trim()

    if (!reason) {
      return res.status(400).json({ msg: 'A rejection reason is required' })
    }
    if (reason.length > 500) {
      return res.status(400).json({ msg: 'Reason must be 500 characters or fewer' })
    }

    const recipe = await getRecipeAndVerify(
      id,
      ['pending'],
      'Recipe not found',
      'Only pending recipes can be rejected'
    )

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedReason: reason,
        reviewedAt: new Date()
      }
    })

    if (updated.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          recipeId: updated.id,
          type: 'rejected',
          message: `Your recipe "${updated.title}" was rejected: ${reason}`
        }
      })
    }

    const full = await fetchFullRecipe(id)
    res.json({ msg: 'Recipe rejected', recipe: toAdminRecipe(full) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ msg: err.message })
    console.error('Reject recipe error:', err)
    res.status(500).json({ msg: 'Failed to reject recipe' })
  }
}

async function unpublishRecipe(req, res) {
  try {
    const { id } = req.params
    const recipe = await getRecipeAndVerify(
      id,
      ['published'],
      'Recipe not found',
      'Only published recipes can be unpublished'
    )

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        isGlobal: false,
        status: 'pending',
        rejectedReason: null,
        reviewedAt: new Date()
      }
    })

    const full = await fetchFullRecipe(id)
    res.json({ msg: 'Recipe unpublished', recipe: toAdminRecipe(full) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ msg: err.message })
    console.error('Unpublish recipe error:', err)
    res.status(500).json({ msg: 'Failed to unpublish recipe' })
  }
}

module.exports = {
  getRecipesByStatus,
  approveRecipe,
  rejectRecipe,
  unpublishRecipe
}