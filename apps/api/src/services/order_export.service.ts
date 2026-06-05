import prisma from '../db/client.js';

export class OrderExportService {
  static async getFilteredOrders(filters: any) {
    const {
      searchTerm,
      statusFilter,
      paymentFilter,
      sellerFilter,
      partnerFilter,
      customerFilter,
      startDate,
      endDate,
    } = filters;

    const where: any = {};

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (paymentFilter) {
      where.paymentStatus = paymentFilter;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    const AND: any[] = [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      AND.push({
        OR: [
          { id: { contains: term, mode: 'insensitive' } },
          { orderNumber: { contains: term, mode: 'insensitive' } },
          { customer: { name: { contains: term, mode: 'insensitive' } } },
          { seller: { shopName: { contains: term, mode: 'insensitive' } } },
        ]
      });
    }

    if (sellerFilter) {
      AND.push({ seller: { shopName: { equals: sellerFilter } } });
    }

    if (customerFilter) {
      AND.push({ customer: { name: { equals: customerFilter } } });
    }

    if (partnerFilter) {
      AND.push({ delivery: { partner: { user: { name: { equals: partnerFilter } } } } });
    }

    if (AND.length > 0) {
      where.AND = AND;
    }

    return await prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        seller: { select: { shopName: true } },
        delivery: { include: { partner: { include: { user: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
