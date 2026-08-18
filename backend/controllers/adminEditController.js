const prisma = require('../config/prismaClient')
const { serializeEdit, USER_SELECT } = require('./recipeEditController')

function toAdminEdit(edit) {
  return {
    ...serializeEdit(edit),
    recipe: edit.recipe
      ? {
          ...edit.recipe,
          madeByUser: Boolean(edit.recipe.userId),
          rating: null,
          myRating: null,
          comments: []
        }
      : null
  }
}

async function getPendingEdits(req, res) {
  try {
    const edits = await prisma.recipeEdit.findMany({
      where: { status: 'pending' },
      include: {
        recipe: {
          include: {
            ingredients: true,
            user: { select: USER_SELECT }
          }
        },
        user: { select: USER_SELECT }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ edits: edits.map(toAdminEdit) })
  } catch (err) {
    console.error('Get pending edits error:', err)
    res.status(500).json({ msg: 'Failed to fetch pending edits' })
  }
}

async function approveEdit(req, res) {
  try {
    const { id } = req.params

    const edit = await prisma.recipeEdit.findUnique({
      where: { id },
      include: { recipe: true }
    })

    if (!edit) {
      return res.status(404).json({ msg: 'Edit not found' })
    }
    if (edit.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending edits can be approved' })
    }

    const ingredients = Array.isArray(edit.ingredients) ? edit.ingredients : []

    await prisma.$transaction(async (tx) => {
      await tx.ingredient.deleteMany({ where: { recipeId: edit.recipeId } })

      await tx.recipe.update({
        where: { id: edit.recipeId },
        data: {
          title: edit.title,
          description: edit.description,
          steps: edit.steps,
          imageUrl: edit.imageUrl,
          category: edit.category,
          difficulty: edit.difficulty,
          cookingTime: edit.cookingTime,
          servings: edit.servings,
          cuisine: edit.cuisine,
          dietaryTags: edit.dietaryTags,
          status: 'published',
          isGlobal: true,
          rejectedReason: null,
          reviewedAt: new Date(),
          ingredients: {
            create: ingredients.map((ing) => ({
              name: ing.name,
              amount: parseFloat(ing.amount),
              unit: ing.unit
            }))
          }
        }
      })

      await tx.recipeEdit.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedAt: new Date()
        }
      })

      if (edit.userId) {
        await tx.notification.create({
          data: {
            userId: edit.userId,
            recipeId: edit.recipeId,
            type: 'edit_approved',
            message: `Your edits to "${edit.title}" were approved and are now live.`
          }
        })
      }
    })

    const updated = await prisma.recipeEdit.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: true,
            user: { select: USER_SELECT }
          }
        },
        user: { select: USER_SELECT }
      }
    })

    res.json({ msg: 'Edit approved and applied', edit: toAdminEdit(updated) })
  } catch (err) {
    console.error('Approve edit error:', err)
    res.status(500).json({ msg: 'Failed to approve edit' })
  }
}

async function rejectEdit(req, res) {
  try {
    const { id } = req.params
    const reason = String(req.body.reason || '').trim()

    if (!reason) {
      return res.status(400).json({ msg: 'A rejection reason is required' })
    }
    if (reason.length > 500) {
      return res.status(400).json({ msg: 'Reason must be 500 characters or fewer' })
    }

    const edit = await prisma.recipeEdit.findUnique({
      where: { id },
      include: { recipe: true }
    })

    if (!edit) {
      return res.status(404).json({ msg: 'Edit not found' })
    }
    if (edit.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending edits can be rejected' })
    }

    const updated = await prisma.recipeEdit.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedReason: reason,
        reviewedAt: new Date()
      }
    })

    if (edit.userId) {
      await prisma.notification.create({
        data: {
          userId: edit.userId,
          recipeId: edit.recipeId,
          type: 'edit_rejected',
          message: `Your edits to "${edit.recipe.title}" were rejected: ${reason}`
        }
      })
    }

    res.json({ msg: 'Edit rejected', edit: serializeEdit(updated) })
  } catch (err) {
    console.error('Reject edit error:', err)
    res.status(500).json({ msg: 'Failed to reject edit' })
  }
}

module.exports = {
  getPendingEdits,
  approveEdit,
  rejectEdit
}
