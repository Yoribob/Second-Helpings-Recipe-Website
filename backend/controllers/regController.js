const registerUser = require('../services/regService')
const getClientIP = require('../utils/ip')
const isProduction = process.env.NODE_ENV === 'production'
const accessCookieOptions = {httpOnly:true,secure:isProduction,sameSite:isProduction?'None':'Lax',maxAge:15*60*1000,path:'/'}
const refreshCookieOptions = {httpOnly:true,secure:isProduction,sameSite:isProduction?'None':'Lax',maxAge:7*24*60*60*1000,path:'/'}
async function register(req, res) {
  try {
    const {accessToken, refreshToken} = await registerUser({username:req.body.username,password:req.body.password,email:req.body.email,userAgent:req.headers['user-agent'],ip:getClientIP(req)})
    res.cookie('accessToken', accessToken, accessCookieOptions)
    res.cookie('refreshToken', refreshToken, refreshCookieOptions).json({msg:'Registered successfully'})
  } catch (err) {
    if (err.code === 'USER_EXISTS') return res.status(409).json({msg:'Username already taken'})
    if (err.code === 'EMAIL_EXISTS') return res.status(409).json({msg:'Email already in use'})
    if (err.code === 'INVALID_EMAIL') return res.status(400).json({msg:'Invalid email format'})
    res.sendStatus(500)
  }
}
module.exports = register