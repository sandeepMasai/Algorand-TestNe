import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "../src/config/db";
import algorandRouter from "../src/routes/algorand";

// Load environment variables from backend/.env
// Try multiple paths to find .env file (works when running from different directories)
const envPaths = [
  path.resolve(process.cwd(), ".env"), // When running from backend/
  path.resolve(__dirname, "../../.env"), // When running from backend/src/ (compiled)
  path.resolve(process.cwd(), "../.env"), // When running from backend/src/
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✓ Loaded .env from: ${envPath}`);
    break;
  }
}

const app = express();

// ----------------------
//  Security & Body Parsing
// ----------------------
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// ----------------------
//  CORS Setup
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
//  Logging
// ----------------------
app.use(morgan("dev"));

// ----------------------
//  Rate Limiting
// ----------------------
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000, // default 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 60, // limit each IP to 60 requests/minute
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// ----------------------
// Database Connection
// ----------------------
(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI in environment variables.");
    await connectDB(uri);
    console.log(" Database connected successfully");
  } catch (error: any) {
    console.error(" Database connection failed:", error.message);
    process.exit(1);
  }
})();

// ----------------------
//  Routes
// ----------------------
app.use("/api/algorand", algorandRouter);

// ----------------------
//  Health Check
// ----------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(` Server running at http://localhost:${PORT}`)
);

export default app;
