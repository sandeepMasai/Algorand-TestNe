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
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// ----------------------
// CORS
// ----------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: false,
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
