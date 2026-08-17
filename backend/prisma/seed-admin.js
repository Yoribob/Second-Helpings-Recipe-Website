const { PrismaClient } = require('@prisma/client')
const { hashPassword } = require('../utils/password')

require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!username || !email || !password) {
    console.error('ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in the environment')
    process.exit(1)
  }

  const usernameLower = String(username).toLowerCase()
  const emailLower = String(email).toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { username: usernameLower } })

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin "${existing.usernameOriginal}" already exists`)
    } else {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } })
      console.log(`Upgraded existing user "${existing.usernameOriginal}" to admin`)
    }
    return
  }

  const emailTaken = await prisma.user.findUnique({ where: { email: emailLower } })
  if (emailTaken) {
    if (emailTaken.role === 'admin') {
      console.log(`Admin "${emailTaken.usernameOriginal}" (email match) already exists`)
    } else {
      await prisma.user.update({ where: { id: emailTaken.id }, data: { role: 'admin' } })
      console.log(`Upgraded existing user "${emailTaken.usernameOriginal}" (email match) to admin`)
    }
    return
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.create({
    data: {
      username: usernameLower,
      usernameOriginal: String(username),
      email: emailLower,
      passwordHash,
      role: 'admin'
    }
  })

  console.log(`Created admin "${username}"`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('Seed admin failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })