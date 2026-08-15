const {verifyAccessToken} = require('../utils/jwt')
function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.accessToken
    if (!token) return res.status(401).json({msg:'No token provided'})
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({msg:'Invalid or expired token'})
  }
}

function optionalAuthMiddleware(req, res, next) {
  const token = req.cookies.accessToken
  if (token) {
    try {
      req.user = verifyAccessToken(token)
    } catch {}
  }
  next()
}

module.exports = authMiddleware
module.exports.optionalAuth = optionalAuthMiddleware