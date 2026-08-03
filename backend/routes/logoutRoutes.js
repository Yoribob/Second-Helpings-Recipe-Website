const logout = require('../controllers/logoutController')
const express = require('express')
const router = express.Router()
router.post('/', logout)
module.exports = router