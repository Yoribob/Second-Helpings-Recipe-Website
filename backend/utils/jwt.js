const jwt = require('jsonwebtoken')
let secrets = null

function configureSecrets(accessSecret, refreshSecret) {
  secrets = {
    access: accessSecret || process.env.JWT_ACCESS_SECRET,
    refresh: refreshSecret || process.env.JWT_REFRESH_SECRET,
  }
  if (!secrets.access || !secrets.refresh) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment')
  }
}

function signAccessToken(payload) {
  return jwt.sign(payload, secrets?.access || process.env.JWT_ACCESS_SECRET, {expiresIn:'15m'})
}
function signRefreshToken(payload) {
  return jwt.sign(payload, secrets?.refresh || process.env.JWT_REFRESH_SECRET, {expiresIn:'7d'})
}
function verifyAccessToken(token) {
  return jwt.verify(token, secrets?.access || process.env.JWT_ACCESS_SECRET)
}
function verifyRefreshToken(token) {
  return jwt.verify(token, secrets?.refresh || process.env.JWT_REFRESH_SECRET)
}
module.exports = { configureSecrets, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken }