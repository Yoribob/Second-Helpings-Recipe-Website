const prisma = require('../config/prismaClient')
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({where: {id: req.user.userId}})
    if (!user) return res.status(404).json({msg: 'User not found'})
    res.json({msg: 'Protected user information',user: {id: user.id,username: user.username,usernameOriginal: user.usernameOriginal,email: user.email,createdAt: user.createdAt}})
  } catch (err) {
    res.status(500).json({msg: 'Failed to get user information'})
  }
}
module.exports = getMe
