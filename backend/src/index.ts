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
// Security & JSON Parsing
// ----------------------
// Configure helmet to allow CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json({ limit: "1mb" }));

// ----------------------
// CORS Configuration
// ----------------------
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
const allowedOrigins = corsOriginsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // If CORS_ORIGINS is set to "*" or empty, allow all origins
      if (corsOriginsEnv === "*" || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

export default app;
