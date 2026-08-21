const prisma = require("../config/prismaClient");
const { clearAuthCookies } = require("../utils/authCookies");

async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) await prisma.refreshToken.deleteMany({ where: { token } });

  clearAuthCookies(res);
  res.json({ msg: "Logged out successfully" });
}

module.exports = logout;
