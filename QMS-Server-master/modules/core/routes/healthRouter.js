const Router = require("express");
const router = new Router();
const sequelize = require("../../../db");

// Liveness probe - server is running
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Readiness probe - server is ready to accept requests
router.get("/ready", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (err) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err.message,
    });
  }
});

module.exports = router;
