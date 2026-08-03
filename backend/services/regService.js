const prisma = require('../config/prismaClient')
const {hashPassword} = require('../utils/password')
const {signAccessToken, signRefreshToken} = require('../utils/jwt')
async function registerUser({username, password, email, userAgent, ip}) {
  const usernameOriginal = username
  username = username.toLowerCase()
  email = email ? email.toLowerCase().trim() : null
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const err = new Error('Invalid email format')
      err.code = 'INVALID_EMAIL'
      throw err
    }
  }
  const usernameExists = await prisma.user.findUnique({where: {username}})
  if (usernameExists) {
    const err = new Error('Username already taken')
    err.code = 'USER_EXISTS'
    throw err
  }
  if (email) {
    const emailExists = await prisma.user.findUnique({where: {email}})
    if (emailExists) {
      const err = new Error('Email already in use')
      err.code = 'EMAIL_EXISTS'
      throw err
    }
  }
  const hashed = await hashPassword(password)
  const user = await prisma.user.create({data: {username, usernameOriginal, email, passwordHash: hashed}})
  const userId = user.id
  const accessToken = signAccessToken({userId, username, usernameOriginal})
  const refreshToken = signRefreshToken({userId, username, usernameOriginal})
  await prisma.refreshToken.create({data: {userId,token: refreshToken,device: userAgent,ip}})
  return {accessToken, refreshToken}
}
module.exports = registerUser
