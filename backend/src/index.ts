import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

import { connectDB } from "./config/db";
import algorandRouter from "./routes/algorand";

// ----------------------
// Load .env (Works on Render)
// ----------------------
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();

// ----------------------
// CORS Configuration (MUST be before other middleware)
// ----------------------
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "*";
const allowedOrigins = corsOriginsEnv === "*"
  ? "*"
  : corsOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins === "*" ? true : allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

// ----------------------
// Security & JSON Parsing
// ----------------------
// Configure helmet to allow CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Logging
// ----------------------
app.use(morgan("dev"));

// ----------------------
// Rate Limiting
// ----------------------
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 60,
});
app.use("/api/", limiter);

// ----------------------
// Database Connection
// ----------------------
(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI in env");

    await connectDB(uri);
    console.log("✓ Database connected");
  } catch (err: any) {
    console.error("✗ DB connection failed:", err.message);
    process.exit(1);
  }
})();

// ----------------------
// Routes
// ----------------------
app.use("/api/algorand", algorandRouter);

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ----------------------
// Error Handling Middleware
// ----------------------
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  const corsInfo = corsOriginsEnv === "*"
    ? "all origins"
    : Array.isArray(allowedOrigins)
      ? allowedOrigins.join(", ")
      : allowedOrigins;
  console.log(`✓ CORS enabled for: ${corsInfo}`);
});

export default app;
