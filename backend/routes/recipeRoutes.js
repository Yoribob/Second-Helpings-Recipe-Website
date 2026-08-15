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
  getRecipeMetadata
} = require('../controllers/recipeController')

router.get('/metadata', getRecipeMetadata)

router.get('/', getAllRecipes)

router.get('/global', getGlobalRecipes)

router.get('/my', authMiddleware, getMyRecipes)

router.get('/:id', authMiddleware.optionalAuth, getRecipeById)

router.post('/', authMiddleware, createRecipe)

router.put('/:id', authMiddleware, updateRecipe)

router.delete('/:id', authMiddleware, deleteRecipe)

module.exports = router
