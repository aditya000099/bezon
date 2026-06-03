import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const deliveryInfoTool = createTool({
  id: 'get-delivery-info',
  description:
    'Get delivery partner details and tracking timeline for a specific order. Requires userId for security.',
  inputSchema: z.object({
    orderId: z.string().describe('The UUID of the order'),
    userId: z.string().describe('The authenticated customer user ID for ownership verification'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    message: z.string().optional(),
    delivery: z
      .object({
        deliveryStatus: z.string(),
        partnerName: z.string().nullable(),
        partnerPhone: z.string().nullable(),
        vehicleType: z.string().nullable(),
        assignedAt: z.string().nullable(),
        acceptedAt: z.string().nullable(),
        pickedUpAt: z.string().nullable(),
        deliveredAt: z.string().nullable(),
        timeline: z.array(
          z.object({
            status: z.string(),
            note: z.string().nullable(),
            timestamp: z.string(),
          }),
        ),
      })
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { orderId, userId } = inputData;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true },
      });

      if (!order || order.customerId !== userId) {
        return { found: false, message: 'Order not found or access denied.' };
      }

      const delivery = await prisma.delivery.findUnique({
        where: { orderId },
        include: {
          partner: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!delivery) {
        return {
          found: false,
          message: 'Delivery has not been assigned yet for this order. Please check back later.',
        };
      }

      return {
        found: true,
        delivery: {
          deliveryStatus: delivery.status,
          partnerName: delivery.partner?.user?.name ?? null,
          partnerPhone: delivery.partner?.user?.phone ?? null,
          vehicleType: delivery.partner?.vehicleType ?? null,
          assignedAt: delivery.assignedAt?.toISOString() ?? null,
          acceptedAt: delivery.acceptedAt?.toISOString() ?? null,
          pickedUpAt: delivery.pickedUpAt?.toISOString() ?? null,
          deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
          timeline: delivery.timeline.map((entry) => ({
            status: entry.status,
            note: entry.note,
            timestamp: entry.createdAt.toISOString(),
          })),
        },
      };
    } catch (error) {
      return {
        found: false,
        message: `Failed to fetch delivery info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
