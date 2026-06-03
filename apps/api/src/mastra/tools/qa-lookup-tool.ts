import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const qaLookupTool = createTool({
  id: 'search-product-qa',
  description:
    'Search existing product questions and answers (FAQ). Use this to find answers to customer questions about a product before creating a new question.',
  inputSchema: z.object({
    productId: z.string().describe('The UUID of the product'),
    searchQuery: z
      .string()
      .optional()
      .describe('Optional search term to filter questions by keyword'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    message: z.string().optional(),
    questions: z
      .array(
        z.object({
          questionText: z.string(),
          askerName: z.string(),
          date: z.string(),
          answers: z.array(
            z.object({
              answerText: z.string(),
              answererName: z.string(),
              date: z.string(),
            }),
          ),
        }),
      )
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { productId, searchQuery } = inputData;

      const whereClause: Record<string, unknown> = { productId };

      if (searchQuery) {
        whereClause.question = {
          contains: searchQuery,
          mode: 'insensitive',
        };
      }

      const questions = await prisma.productQuestion.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true } },
          answers: {
            include: {
              user: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (questions.length === 0) {
        return {
          found: false,
          message: searchQuery
            ? 'No matching questions found for this product. You may want to create a new question.'
            : 'No questions have been asked about this product yet.',
          questions: [],
        };
      }

      return {
        found: true,
        questions: questions.map((q) => ({
          questionText: q.question,
          askerName: q.user.name,
          date: q.createdAt.toISOString(),
          answers: q.answers.map((a) => ({
            answerText: a.answer,
            answererName: a.user.name,
            date: a.createdAt.toISOString(),
          })),
        })),
      };
    } catch (error) {
      return {
        found: false,
        message: `Failed to search Q&A: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
