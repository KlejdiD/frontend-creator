const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { RateLimiterMemory } = require("rate-limiter-flexible");
require("dotenv").config();

// Debug logging
console.log("🔧 Server starting...");
console.log(
  "🔑 Gemini API Key loaded:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);
console.log(
  "🔑 API Key starts with:",
  process.env.GEMINI_API_KEY?.substring(0, 10) + "..."
);
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🚪 Port:", process.env.PORT);
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: "middleware",
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // 15 minutes
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send("Too Many Requests");
    });
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(rateLimiterMiddleware);

// Import routes after middleware setup
const analyzeRoutes = require("./controllers/analyzeController");
const lighthouseRoutes = require("./controllers/lighthouseController");

// Routes
app.use("/api/analyze", analyzeRoutes);
app.use("/api/lighthouse", lighthouseRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Frontend SEO Analyzer API ready`);
});
