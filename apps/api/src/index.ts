import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './db/client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'bezon-cookie-secret'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
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

// Mock Auth routes as placeholder layout
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  // Handle mock responses
  let name = 'Customer User';
  let role = 'customer';
  if (email.startsWith('admin')) {
    name = 'Admin User';
    role = 'admin';
  } else if (email.startsWith('seller')) {
    name = 'Seller Shop';
    role = 'seller';
  } else if (email.startsWith('delivery')) {
    name = 'Courier Agent';
    role = 'delivery';
  }

  // Set httpOnly cookie mock token
  res.cookie('token', 'mock-jwt-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: 'mock-user-uuid',
      name,
      email,
      role,
      isActive: true,
    },
  });
});

app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized session' });
  }
  
  let email = 'customer1@bezon.app';
  let name = 'Customer User';
  let role = 'customer';

  // Determine user parameters from cookie value (mock authorization)
  if (token === 'mock-jwt-token-admin') {
    email = 'admin@bezon.app';
    name = 'Admin User';
    role = 'admin';
  } else if (token === 'mock-jwt-token-seller') {
    email = 'seller1@bezon.app';
    name = 'Seller Shop';
    role = 'seller';
  } else if (token === 'mock-jwt-token-delivery') {
    email = 'delivery1@bezon.app';
    name = 'Courier Agent';
    role = 'delivery';
  }

  res.json({
    success: true,
    data: {
      id: 'mock-user-uuid',
      name,
      email,
      role,
      isActive: true,
    },
  });
});

// Generic 404 Route
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Bezon Server] Running on port ${PORT}`);
});
