const { loginUser } = require("../services/authService");
const getClientIP = require("../utils/ip");
const { setAuthCookies } = require("../utils/authCookies");

async function login(req, res) {
  try {
    const { accessToken, refreshToken } = await loginUser({
      username: req.body.username,
      password: req.body.password,
      userAgent: req.headers["user-agent"],
      ip: getClientIP(req),
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ msg: "Logged in successfully" });
  } catch (err) {
    if (err.code === "LOGIN_FAILED") {
      return res.status(401).json({ msg: "Login or password is incorrect" });
    }
    res.sendStatus(500);
  }
}

module.exports = login;
