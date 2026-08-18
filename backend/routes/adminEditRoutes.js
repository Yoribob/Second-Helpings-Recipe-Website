const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const requireAdmin = require('../middleware/adminMiddleware')
const {
  getPendingEdits,
  approveEdit,
  rejectEdit
} = require('../controllers/adminEditController')

router.use(auth, requireAdmin)

router.get('/', getPendingEdits)
router.patch('/:id/approve', approveEdit)
router.patch('/:id/reject', rejectEdit)

module.exports = router
