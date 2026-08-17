const prisma = require('../config/prismaClient')

async function adminMiddleware(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }
    })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' })
    }
    next()
  } catch (err) {
    console.error('Admin middleware error:', err)
    return res.status(500).json({ msg: 'Failed to check admin access' })
  }
}

module.exports = adminMiddleware