const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getAllRecipes,
  getRecipeById,
  getMyRecipes,
  getGlobalRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeMetadata,
  rateRecipe,
  createComment,
  deleteComment
} = require('../controllers/recipeController')

router.get('/metadata', getRecipeMetadata)

router.get('/', getAllRecipes)

router.get('/global', getGlobalRecipes)

router.get('/my', authMiddleware, getMyRecipes)

router.get('/:id', authMiddleware.optionalAuth, getRecipeById)

router.post('/:id/rating', authMiddleware, rateRecipe)

router.post('/:id/comments', authMiddleware, createComment)

router.delete('/:id/comments/:commentId', authMiddleware, deleteComment)

router.post('/', authMiddleware, createRecipe)

router.put('/:id', authMiddleware, updateRecipe)

router.delete('/:id', authMiddleware, deleteRecipe)

module.exports = router
