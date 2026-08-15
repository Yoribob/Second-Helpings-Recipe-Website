const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const {
  getBookmarks,
  addBookmark,
  removeBookmark
} = require('../controllers/bookmarkController')

router.use(auth)

router.get('/', getBookmarks)
router.post('/:recipeId', addBookmark)
router.delete('/:recipeId', removeBookmark)

module.exports = router