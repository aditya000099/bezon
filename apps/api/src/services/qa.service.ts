import prisma from '../db/client.js';
import { questionSchema, answerSchema } from '@bezon/validation';
import { NotificationService } from './notification.service.js';

export class QAService {
  // Ask a question about a product
  static async askQuestion(userId: string, data: { productId: string; variantId?: string; question: string }) {
    // Validate the input
    const parsed = questionSchema.safeParse(data);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    // Make sure the product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        seller: { select: { userId: true } },
      },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Create the question
    const question = await prisma.productQuestion.create({
      data: {
        productId: data.productId,
        userId,
        variantId: data.variantId || null,
        question: data.question,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify the seller (fire-and-forget — do not block the response)
    NotificationService.create(
      product.seller.userId,
      'question_asked',
      'New Question on Your Product',
      `Someone asked a question about "${product.title}"`,
      { productSlug: product.slug, questionId: question.id },
    ).catch((err) => console.error('Failed to create question notification:', err));

    return question;
  }

  // Answer a question
  static async answerQuestion(userId: string, data: { questionId: string; answer: string }) {
    // Validate the input
    const parsed = answerSchema.safeParse(data);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    // Make sure the question exists
    const question = await prisma.productQuestion.findUnique({
      where: { id: data.questionId },
      include: {
        product: {
          include: { seller: { select: { userId: true } } },
        },
      },
    });

    if (!question) {
      const err = new Error('Question not found.');
      (err as any).status = 404;
      throw err;
    }

    // Create the answer
    const answer = await prisma.productAnswer.create({
      data: {
        questionId: data.questionId,
        userId,
        answer: data.answer,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Compute badge for the answer author
    const badge = await QAService.computeBadge(
      userId,
      question.productId,
      question.product.seller.userId,
    );

    return { ...answer, badge };
  }

  // Get paginated questions for a product with their answers + badges
  static async getProductQuestions(
    productId: string,
    query: { page?: number; limit?: number; sort?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    // Determine ordering
    let orderBy: any = { createdAt: 'desc' as const }; // Default: most recent

    // Build a where clause — for "answered" / "unanswered" sorting, we filter instead
    let where: any = { productId };
    if (query.sort === 'answered') {
      where.answers = { some: {} };
    } else if (query.sort === 'unanswered') {
      where.answers = { none: {} };
    }

    const [questions, totalCount] = await prisma.$transaction([
      prisma.productQuestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          answers: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.productQuestion.count({ where }),
    ]);

    // Look up the seller's userId for badge calculation
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { userId: true } } },
    });

    const sellerUserId = product?.seller?.userId;

    // Compute badges for every answer
    const questionsWithBadges = await Promise.all(
      questions.map(async (q) => ({
        ...q,
        answers: await Promise.all(
          q.answers.map(async (a) => ({
            ...a,
            badge: await QAService.computeBadge(a.userId, productId, sellerUserId || ''),
          })),
        ),
      })),
    );

    return {
      questions: questionsWithBadges,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Get all questions for a seller's products (for seller Q&A dashboard)
  static async getSellerQuestions(
    userId: string,
    query: { page?: number; limit?: number; productId?: string; filter?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    // Find the seller record for this user
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile not found.');
      (err as any).status = 403;
      throw err;
    }

    // Build query: only questions on this seller's products
    const where: any = {
      product: { sellerId: seller.id },
    };

    // Optional: filter by specific product
    if (query.productId) {
      where.productId = query.productId;
    }

    // Optional: filter answered/unanswered
    if (query.filter === 'answered') {
      where.answers = { some: {} };
    } else if (query.filter === 'unanswered') {
      where.answers = { none: {} };
    }

    const [questions, totalCount] = await prisma.$transaction([
      prisma.productQuestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          product: { select: { id: true, title: true, slug: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
          answers: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.productQuestion.count({ where }),
    ]);

    // Compute badges for answers
    const questionsWithBadges = await Promise.all(
      questions.map(async (q) => ({
        ...q,
        answers: await Promise.all(
          q.answers.map(async (a) => ({
            ...a,
            badge: await QAService.computeBadge(a.userId, q.productId, userId),
          })),
        ),
      })),
    );

    return {
      questions: questionsWithBadges,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Get the seller's product list (for filter dropdown)
  static async getSellerProducts(userId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return [];

    return prisma.product.findMany({
      where: { sellerId: seller.id },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
  }

  // Determine the badge for an answer author
  // "seller" badge takes priority over "verified_buyer"
  static async computeBadge(
    answerUserId: string,
    productId: string,
    sellerUserId: string,
  ): Promise<'seller' | 'verified_buyer' | null> {
    // Check if the answerer is the product's seller
    if (answerUserId === sellerUserId) {
      return 'seller';
    }

    // Check if the answerer has a delivered order containing this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: answerUserId,
          status: 'delivered',
        },
      },
      select: { id: true },
    });

    if (hasPurchased) {
      return 'verified_buyer';
    }

    return null;
  }
}
