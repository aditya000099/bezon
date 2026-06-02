import prisma from '../db/client.js';
import { policySchema } from '@bezon/validation';

export class PolicyService {
  static async getAll(activeOnly = false) {
    const where: any = {};
    if (activeOnly) where.isActive = true;

    return prisma.policy.findMany({
      where,
      orderBy: [{ type: 'asc' }, { durationDays: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  static async getById(id: string) {
    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      const err = new Error('Policy not found.');
      (err as any).status = 404;
      throw err;
    }
    return policy;
  }

  static async create(data: any) {
    const result = policySchema.safeParse(data);
    if (!result.success) {
      const err = new Error(result.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    return prisma.policy.create({
      data: {
        type: result.data.type,
        title: result.data.title,
        description: result.data.description || null,
        durationDays: result.data.durationDays,
      },
    });
  }

  static async update(id: string, data: any) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Policy not found.');
      (err as any).status = 404;
      throw err;
    }

    const result = policySchema.safeParse(data);
    if (!result.success) {
      const err = new Error(result.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    return prisma.policy.update({
      where: { id },
      data: {
        type: result.data.type,
        title: result.data.title,
        description: result.data.description || null,
        durationDays: result.data.durationDays,
      },
    });
  }

  static async toggleActive(id: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Policy not found.');
      (err as any).status = 404;
      throw err;
    }

    return prisma.policy.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  static async deletePolicy(id: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Policy not found.');
      (err as any).status = 404;
      throw err;
    }

    await prisma.policy.delete({ where: { id } });
    return { message: 'Policy deleted.' };
  }
}
