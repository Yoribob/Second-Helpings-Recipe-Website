const getMe = require('../controllers/userController')
const auth = require('../middleware/authMiddleware')
const express = require('express')
const router = express.Router()
router.get('/me', auth, getMe)
module.exports = router