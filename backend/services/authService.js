const prisma = require('../config/prismaClient')
const {comparePassword} = require('../utils/password')
const {signAccessToken, signRefreshToken} = require('../utils/jwt')
async function loginUser({username, password, userAgent, ip}) {
  const user = await prisma.user.findUnique({where: {username: username.toLowerCase()}})
  if (!user) {
    const err = new Error('Login or password is incorrect')
    err.code = 'LOGIN_FAILED'
    throw err
  }
  const isMatch = await comparePassword(password, user.passwordHash)
  if (!isMatch) {
    const err = new Error('Login or password is incorrect')
    err.code = 'LOGIN_FAILED'
    throw err
  }
  const accessToken = signAccessToken({userId: user.id,username: user.username,usernameOriginal: user.usernameOriginal})
  const refreshToken = signRefreshToken({userId: user.id,username: user.username,usernameOriginal: user.usernameOriginal})
  await prisma.refreshToken.upsert({where: {userId: user.id},update: {token: refreshToken,createdAt: new Date(),device: userAgent,ip},create: {userId: user.id,token: refreshToken,device: userAgent,ip}})
  return {accessToken, refreshToken}
}
module.exports = {loginUser}
