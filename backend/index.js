import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import algorandRouter from './routes/algorand.js';


dotenv.config();


const app = express();


// Security & parsing
app.use(helmet());
app.use(express.json({ limit: '1mb' }));


// CORS
const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true, credentials: false }));


// Logging
app.use(morgan('dev'));


// Rate limit
const limiter = rateLimit({
windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
max: Number(process.env.RATE_LIMIT_MAX || 60)
});
app.use('/api/', limiter);


// DB
await connectDB(process.env.MONGODB_URI);


// Routes
app.use('/api/algorand', algorandRouter);


// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));