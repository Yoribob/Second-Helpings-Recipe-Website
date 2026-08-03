const prisma = require('../config/prismaClient')
async function logout(req, res) {
  const token = req.cookies.refreshToken
  if (token) await prisma.refreshToken.deleteMany({where: {token}})
  res.clearCookie('accessToken', {httpOnly: true,secure: false,sameSite: 'Lax',path: '/'}).clearCookie('refreshToken', {httpOnly: true,secure: false,sameSite: 'Lax',path: '/'}).json({msg: 'Logged out successfully'})
}
module.exports = logout
