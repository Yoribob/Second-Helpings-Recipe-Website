const jwt = require("jsonwebtoken");
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

    const rotation = await prisma.refreshToken.updateMany({
      where: { userId: payload.userId, token },
      data: {
        token: newRefreshToken,
        createdAt: new Date(),
        device: req.headers["user-agent"],
        ip: getClientIP(req),
      },
    });

    if (rotation.count !== 1) {
      return res.status(401).json({ msg: "Invalid or expired refresh token" });
    }

    setAuthCookies(res, newAccessToken, newRefreshToken);
    res.json({ msg: "Tokens refreshed" });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ msg: "Invalid or expired refresh token" });
    }

    console.error("Failed to refresh auth token:", error);
    return res.status(500).json({ msg: "Unable to refresh token" });
  }
}

module.exports = refreshAccessToken;
