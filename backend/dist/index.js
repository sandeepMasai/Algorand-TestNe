"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const algorand_1 = __importDefault(require("./routes/algorand"));
// ----------------------
// Load .env (Works on Render)
// ----------------------
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
const app = (0, express_1.default)();
// ----------------------
// CORS Configuration (MUST be before other middleware)
// ----------------------
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "*";
const allowedOrigins = corsOriginsEnv === "*"
    ? "*"
    : corsOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins === "*" ? true : allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// ----------------------
// Security & JSON Parsing
// ----------------------
// Configure helmet to allow CORS
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// ----------------------
// Logging
// ----------------------
app.use((0, morgan_1.default)("dev"));
// ----------------------
// Rate Limiting
// ----------------------
const limiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 60,
});
app.use("/api/", limiter);
// ----------------------
// Database Connection
// ----------------------
(async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri)
            throw new Error("Missing MONGODB_URI in env");
        await (0, db_1.connectDB)(uri);
        console.log("✓ Database connected");
    }
    catch (err) {
        console.error("✗ DB connection failed:", err.message);
        process.exit(1);
    }
})();
// ----------------------
// Routes
// ----------------------
app.use("/api/algorand", algorand_1.default);
// Health Check
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});
// ----------------------
// Error Handling Middleware
// ----------------------
app.use((err, _req, res, _next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
        code: err.code || "INTERNAL_ERROR",
    });
});
// 404 Handler
app.use((_req, res) => {
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
exports.default = app;
