const express = require('express')
const http = require('http')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config({override:true})
const prisma = require('./config/prismaClient')
const baseUrl = require('./config/baseUrl')
const authRoutes = require('./routes/authRoutes')
const regRoutes = require('./routes/regRoutes')
const refreshRoutes = require('./routes/refreshRoutes')
const logoutRoutes = require('./routes/logoutRoutes')
const userRoutes = require('./routes/userRoutes')
const recipeRoutes = require('./routes/recipeRoutes')
const app = express()
const server = http.createServer(app)
const corsOriginFn = (origin, callback) => {
  if (!origin || origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
app.set('trust proxy',1)
app.use(cors({origin:corsOriginFn, credentials:true, methods:['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization']}))
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/reg', regRoutes)
app.use('/api/refresh-token', refreshRoutes)
app.use('/api/logout', logoutRoutes)
app.use('/api/user', userRoutes)
app.use('/api/recipes', recipeRoutes)
;(async () => {
  try {
    await prisma.$connect()
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => console.log(`Server running on ${baseUrl}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
})()