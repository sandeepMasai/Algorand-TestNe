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
// Security & JSON Parsing
// ----------------------
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
// ----------------------
// CORS
// ----------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: false,
}));
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
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
exports.default = app;
