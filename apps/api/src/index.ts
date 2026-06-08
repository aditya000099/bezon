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
import { SettlementService } from './services/settlement.service.js';

import { initNsfw } from './utils/nsfw.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

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
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);
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
  // Intercept Prisma Errors to prevent them from leaking raw DB schema info to the UI
  if (err.name === 'PrismaClientValidationError' || err.name === 'PrismaClientKnownRequestError') {
    logger.error(`[Prisma Error] ${err.name} at ${req.method} ${req.url}`);
    logger.error(err.message); // Log full query details to server only

    return res.status(400).json({
      success: false,
      message: 'Database validation failed: Invalid ID or parameters provided.',
    });
  }

  logger.error(err.stack || err.message || err);
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
  logger.info(`[Bezon Server] Running on port ${PORT}`);

  // Pre-load NSFW model
  try {
    await initNsfw();
  } catch (error) {
    logger.error('[NSFW] Failed to initialize NSFW model:', error);
  }

  // Automatic Settlement Processor setup
  // Runs every 12 hours (43200000 ms) in background
  setInterval(() => {
    SettlementService.processSettlements().catch((err) => 
      logger.error('[SettlementService Error]', err)
    );
  }, 43200000);
});
