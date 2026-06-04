import express, { Request, Response, NextFunction } from 'express';
import { MastraServer } from '@mastra/express';
import { mastra } from './mastra/index.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './db/client.js';
import apiRouter from './routes/index.js';

import { initNsfw } from './utils/nsfw.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'bezon-cookie-secret'));

const server = new MastraServer({ app, mastra });
await server.init();

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use(limiter);

// Health Check Route
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Bezon API is healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: err.message,
    });
  }
});

// Mount Modular API Routes
app.use('/api', apiRouter);

// Generic 404 Route
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`[Bezon Server] Running on port ${PORT}`);

  // Pre-load NSFW model
  try {
    await initNsfw();
  } catch (error) {
    console.error('[NSFW] Failed to initialize NSFW model:', error);
  }

});
