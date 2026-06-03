import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const qaCreateTool = createTool({
  id: 'create-product-question',
  description:
    'Create a new question on a product. Use this only when no existing Q&A answers the customer\'s query. The question will be visible to the seller and other customers who can answer it.',
  inputSchema: z.object({
    productId: z.string().describe('The UUID of the product'),
    question: z.string().describe('The question text to post'),
    userId: z.string().describe('The authenticated user ID posting the question'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    questionId: z.string().optional(),
  }),
  execute: async (inputData) => {
    try {
      const { productId, question, userId } = inputData;

      // Verify product exists and is published
      const product = await prisma.product.findFirst({
        where: { id: productId, status: 'published' },
        select: { id: true },
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found or is no longer available.',
        };
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // Create the question
      const newQuestion = await prisma.productQuestion.create({
        data: {
          productId,
          userId,
          question: question.trim(),
        },
      });

      return {
        success: true,
        message:
          'Your question has been posted successfully. The seller and other customers will be able to see and answer it.',
        questionId: newQuestion.id,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
