const prisma = require('../config/prismaClient')

async function getBookmarks(req, res) {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.userId },
      select: { recipeId: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ ids: bookmarks.map(b => b.recipeId) })
  } catch (err) {
    console.error('Get bookmarks error:', err)
    res.status(500).json({ msg: 'Failed to fetch bookmarks' })
  }
}

async function addBookmark(req, res) {
  try {
    const { recipeId } = req.params
    await prisma.bookmark.upsert({
      where: { userId_recipeId: { userId: req.user.userId, recipeId } },
      update: {},
      create: { userId: req.user.userId, recipeId }
    })
    res.status(201).json({ msg: 'Bookmarked' })
  } catch (err) {
    console.error('Add bookmark error:', err)
    res.status(500).json({ msg: 'Failed to save bookmark' })
  }
}

async function removeBookmark(req, res) {
  try {
    const { recipeId } = req.params
    await prisma.bookmark.deleteMany({
      where: { userId: req.user.userId, recipeId }
    })
    res.json({ msg: 'Bookmark removed' })
  } catch (err) {
    console.error('Remove bookmark error:', err)
    res.status(500).json({ msg: 'Failed to remove bookmark' })
  }
}

module.exports = { getBookmarks, addBookmark, removeBookmark }