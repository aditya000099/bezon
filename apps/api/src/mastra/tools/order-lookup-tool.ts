import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const orderLookupTool = createTool({
  id: 'lookup-order',
  description:
    'Look up a customer order by order number or order ID. Returns order status, items, timeline, and delivery information. Always requires userId for security verification.',
  inputSchema: z.object({
    orderId: z.string().optional().describe('The UUID of the order'),
    orderNumber: z.string().optional().describe('The unique order number (e.g. ORD-XXXXXX)'),
    userId: z.string().describe('The authenticated customer user ID for ownership verification'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    message: z.string().optional(),
    order: z
      .object({
        orderNumber: z.string(),
        status: z.string(),
        paymentStatus: z.string(),
        subtotal: z.number(),
        discount: z.number(),
        total: z.number(),
        couponCode: z.string().nullable(),
        createdAt: z.string(),
        sellerShopName: z.string().optional(),
        items: z.array(
          z.object({
            productTitle: z.string(),
            qty: z.number(),
            unitPrice: z.number(),
            totalPrice: z.number(),
            imageUrl: z.string().nullable(),
            sku: z.string().nullable(),
          }),
        ),
        timeline: z.array(
          z.object({
            status: z.string(),
            note: z.string().nullable(),
            createdAt: z.string(),
          }),
        ),
        delivery: z
          .object({
            status: z.string(),
            partnerName: z.string().nullable(),
            partnerPhone: z.string().nullable(),
            assignedAt: z.string().nullable(),
            pickedUpAt: z.string().nullable(),
            deliveredAt: z.string().nullable(),
            deliveryTimeline: z.array(
              z.object({
                status: z.string(),
                note: z.string().nullable(),
                createdAt: z.string(),
              }),
            ),
          })
          .nullable(),
      })
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { orderId, orderNumber, userId } = inputData;

      if (!orderId && !orderNumber) {
        return { found: false, message: 'Please provide either an order ID or order number.' };
      }

      const whereClause: Record<string, string> = {};
      if (orderId) whereClause.id = orderId;
      if (orderNumber) whereClause.orderNumber = orderNumber;

      const order = await prisma.order.findFirst({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          timeline: { orderBy: { createdAt: 'desc' } },
          delivery: {
            include: {
              partner: {
                include: {
                  user: { select: { name: true, phone: true } },
                },
              },
              timeline: { orderBy: { createdAt: 'asc' } },
            },
          },
          seller: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });

      if (!order || order.customerId !== userId) {
        return { found: false, message: 'Order not found or access denied.' };
      }

      return {
        found: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          total: Number(order.total),
          couponCode: order.couponCode,
          createdAt: order.createdAt.toISOString(),
          sellerShopName: order.seller?.shopName,
          items: order.items.map((item) => ({
            productTitle: item.productTitle,
            qty: item.qty,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            imageUrl: item.imageUrl,
            sku: item.sku,
          })),
          timeline: order.timeline.map((entry) => ({
            status: entry.status,
            note: entry.note,
            createdAt: entry.createdAt.toISOString(),
          })),
          delivery: order.delivery
            ? {
                status: order.delivery.status,
                partnerName: order.delivery.partner?.user?.name ?? null,
                partnerPhone: order.delivery.partner?.user?.phone ?? null,
                assignedAt: order.delivery.assignedAt?.toISOString() ?? null,
                pickedUpAt: order.delivery.pickedUpAt?.toISOString() ?? null,
                deliveredAt: order.delivery.deliveredAt?.toISOString() ?? null,
                deliveryTimeline: order.delivery.timeline.map((t) => ({
                  status: t.status,
                  note: t.note,
                  createdAt: t.createdAt.toISOString(),
                })),
              }
            : null,
        },
      };
    } catch (error) {
      return {
        found: false,
        message: `Failed to look up order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
