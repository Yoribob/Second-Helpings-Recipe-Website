const {loginUser} = require('../services/authService')
const getClientIP = require('../utils/ip')
const isProduction = process.env.NODE_ENV === 'production'
const accessCookieOptions = {httpOnly:true,secure:isProduction,sameSite:isProduction?'None':'Lax',maxAge:15*60*1000,path:'/'}
const refreshCookieOptions = {httpOnly:true,secure:isProduction,sameSite:isProduction?'None':'Lax',maxAge:7*24*60*60*1000,path:'/'}
async function login(req, res) {
  try {
    const {accessToken, refreshToken} = await loginUser({username:req.body.username,password:req.body.password,userAgent:req.headers['user-agent'],ip:getClientIP(req)})
    res.cookie('accessToken', accessToken, accessCookieOptions)
    res.cookie('refreshToken', refreshToken, refreshCookieOptions).json({msg:'Logged in successfully'})
  } catch (err) {
    if (err.code === 'LOGIN_FAILED') return res.status(401).json({msg:'Login or password is incorrect'})
    res.sendStatus(500)
  }
}
module.exports = login