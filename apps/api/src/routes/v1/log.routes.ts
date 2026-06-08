import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger.js';

const router = Router();

router.post('/client-error', (req: Request, res: Response) => {
  const { message, stack, url, userAgent, windowSize, user, timestamp, componentStack } = req.body;

  // Build a highly detailed error object
  const errorDetails = {
    url,
    userAgent,
    windowSize,
    user: user || 'unauthenticated',
    clientTimestamp: timestamp,
    stack,
    componentStack,
  };

  // Log it distinctly as a CLIENT-ERROR
  logger.error(`[CLIENT-ERROR] ${message}`, errorDetails);

  res.status(200).json({ success: true, message: 'Log captured' });
});

export default router;
