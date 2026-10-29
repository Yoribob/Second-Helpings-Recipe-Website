const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const prisma = require("./config/prismaClient");
const { configureSecrets } = require("./utils/jwt");
const authRoutes = require("./routes/authRoutes");
const regRoutes = require("./routes/regRoutes");
const refreshRoutes = require("./routes/refreshRoutes");
const logoutRoutes = require("./routes/logoutRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);

let allowedOrigins = new Set();

function configureRuntime(env = process.env) {
  allowedOrigins = new Set(
    [env.ORIGIN, env.FRONTEND_URL]
      .filter(Boolean)
      .map((origin) => origin.replace(/\/$/, "")),
  );
  configureSecrets(env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, "");
      if (
        allowedOrigins.has(normalized) ||
        normalized.endsWith(".vercel.app") ||
        normalized.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/reg", regRoutes);
app.use("/api/refresh-token", refreshRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/user", userRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/admin/recipes", adminRoutes);
app.use("/api/admin/recipe-edits", require("./routes/adminEditRoutes"));
app.use("/api/notifications", notificationRoutes);

async function start() {
  try {
    configureRuntime(process.env);
    await prisma.initialize(process.env.DATABASE_URL);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  start();
}

module.exports = {
  server,
  configureRuntime,
  initializeDatabase: prisma.initialize,
  withDatabaseClient: prisma.withClient,
};
