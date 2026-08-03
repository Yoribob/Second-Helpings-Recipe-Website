const refresh = require('../controllers/refreshController')
const express = require('express')
const router = express.Router()
router.post('/', refresh)
module.exports = router