import { Router, Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { mastra } from '../../mastra/index.js';

const router = Router();

/**
 * POST /api/v1/support/chat
 * Streams a response from the Bezon Support Agent.
 * Requires authentication. Injects userId into messages for tool security.
 */
router.post('/chat', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { messages, threadId, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: 'Messages array is required' });
      return;
    }

    const agent = mastra.getAgent('supportAgent');
    if (!agent) {
      res.status(500).json({ success: false, message: 'Support agent not available' });
      return;
    }

    // Inject userId and page context into the latest user message so tools can verify ownership and have page context
    const enrichedMessages = messages.map((msg: any, i: number) => {
      if (i === messages.length - 1 && msg.role === 'user') {
        let systemCtx = `userId=${user.id}, userName=${user.name}`;
        if (context) {
          if (context.type === 'order') {
            systemCtx += `, contextOrderId=${context.orderId}, contextOrderNumber=${context.orderNumber}`;
          } else if (context.type === 'product') {
            systemCtx += `, contextProductId=${context.productId}, contextProductSlug=${context.productSlug}`;
          }
        }
        return {
          ...msg,
          content: `[SYSTEM_CONTEXT: ${systemCtx}]\n\n${msg.content}`,
        };
      }
      return msg;
    });

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const result = await agent.stream(enrichedMessages, {
      maxSteps: 10,
      ...(threadId ? { memory: { thread: threadId, resource: user.id } } : {}),
    });

    // Stream the text response
    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
    }

    // Signal completion
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[SupportChat] Error:', error.message);
    // If headers already sent, just end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred. Please try again.' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ success: false, message: 'Support chat unavailable. Please try again later.' });
    }
  }
});

export default router;
