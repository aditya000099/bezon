import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const orderPolicyCheckTool = createTool({
  id: 'check-order-policy-eligibility',
  description:
    'Check if items in a delivered order are eligible for return, refund, or replacement based on product policies and delivery date.',
  inputSchema: z.object({
    orderId: z.string().describe('The UUID of the order'),
    userId: z.string().describe('The authenticated customer user ID for ownership verification'),
  }),
  outputSchema: z.object({
    eligible: z.boolean(),
    message: z.string().optional(),
    items: z
      .array(
        z.object({
          productTitle: z.string(),
          imageUrl: z.string().nullable(),
          policies: z.array(
            z.object({
              type: z.string(),
              title: z.string(),
              durationDays: z.number(),
              daysRemaining: z.number(),
              isEligible: z.boolean(),
            }),
          ),
        }),
      )
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { orderId, userId } = inputData;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          delivery: { select: { deliveredAt: true } },
          items: {
            include: {
              product: {
                include: {
                  policies: {
                    include: {
                      policy: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!order || order.customerId !== userId) {
        return { eligible: false, message: 'Order not found or access denied.' };
      }

      if (order.status !== 'delivered') {
        return {
          eligible: false,
          message:
            'Policy actions (return, refund, replacement) are only available for delivered orders. Your order status is: ' +
            order.status,
        };
      }

      if (!order.delivery?.deliveredAt) {
        return {
          eligible: false,
          message: 'Delivery date could not be determined. Please contact support for assistance.',
        };
      }

      const deliveredAt = order.delivery.deliveredAt;
      const now = new Date();
      const msElapsed = now.getTime() - deliveredAt.getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

      const items = order.items.map((item) => {
        const activePolicies = item.product.policies
          .filter((pp) => pp.policy.isActive)
          .map((pp) => {
            const daysRemaining = Math.max(0, Math.ceil(pp.policy.durationDays - daysElapsed));
            const isEligible = daysElapsed <= pp.policy.durationDays;

            return {
              type: pp.policy.type,
              title: pp.policy.title,
              durationDays: pp.policy.durationDays,
              daysRemaining,
              isEligible,
            };
          });

        return {
          productTitle: item.productTitle,
          imageUrl: item.imageUrl,
          policies: activePolicies,
        };
      });

      const hasAnyEligible = items.some((item) => item.policies.some((p) => p.isEligible));

      return {
        eligible: hasAnyEligible,
        items,
      };
    } catch (error) {
      return {
        eligible: false,
        message: `Failed to check policy eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
