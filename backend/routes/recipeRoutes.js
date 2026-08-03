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

router.use(authMiddleware)

router.get('/metadata', getRecipeMetadata)

router.get('/', getAllRecipes)

router.get('/my', getMyRecipes)

router.get('/global', getGlobalRecipes)

router.get('/:id', getRecipeById)

router.post('/', createRecipe)

router.put('/:id', updateRecipe)

router.delete('/:id', deleteRecipe)

module.exports = router
