const {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} = require("../utils/jwt");
const prisma = require("../config/prismaClient");
const getClientIP = require("../utils/ip");
const { setAuthCookies } = require("../utils/authCookies");

async function refreshAccessToken(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ msg: "No refresh token provided" });

    const payload = verifyRefreshToken(token);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { userId: payload.userId },
    });
    if (!storedToken || storedToken.token !== token) {
      return res.status(401).json({ msg: "Invalid or expired refresh token" });
    }

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      username: payload.username,
      usernameOriginal: payload.usernameOriginal,
    });
    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      username: payload.username,
      usernameOriginal: payload.usernameOriginal,
    });

    await prisma.refreshToken.update({
      where: { userId: payload.userId },
      data: {
        token: newRefreshToken,
        createdAt: new Date(),
        device: req.headers["user-agent"],
        ip: getClientIP(req),
      },
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);
    res.json({ msg: "Tokens refreshed" });
  } catch {
    return res.status(401).json({ msg: "Invalid or expired refresh token" });
  }
}

module.exports = refreshAccessToken;
