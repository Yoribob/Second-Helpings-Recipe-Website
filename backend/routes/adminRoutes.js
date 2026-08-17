const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const requireAdmin = require('../middleware/adminMiddleware')
const {
  getRecipesByStatus,
  approveRecipe,
  rejectRecipe,
  unpublishRecipe
} = require('../controllers/adminController')

router.use(auth, requireAdmin)

router.get('/', getRecipesByStatus)
router.patch('/:id/approve', approveRecipe)
router.patch('/:id/reject', rejectRecipe)
router.patch('/:id/unpublish', unpublishRecipe)

module.exports = router