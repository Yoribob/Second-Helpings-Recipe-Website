const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const {
  getNotifications,
  markNotificationRead
} = require('../controllers/notificationController')

router.use(auth)

router.get('/', getNotifications)
router.patch('/:id/read', markNotificationRead)

module.exports = router