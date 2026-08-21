const cookie = require("cookie");

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function serializeAuthCookie(name, value, maxAgeMs) {
  return cookie.serialize(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: Math.floor(maxAgeMs / 1000),
    path: "/",
  });
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.append(
    "Set-Cookie",
    serializeAuthCookie("accessToken", accessToken, ACCESS_MAX_AGE_MS),
  );
  res.append(
    "Set-Cookie",
    serializeAuthCookie("refreshToken", refreshToken, REFRESH_MAX_AGE_MS),
  );
}

function clearAuthCookies(res) {
  const clearOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  };
  res.append("Set-Cookie", cookie.serialize("accessToken", "", clearOpts));
  res.append("Set-Cookie", cookie.serialize("refreshToken", "", clearOpts));
}

module.exports = { setAuthCookies, clearAuthCookies };
