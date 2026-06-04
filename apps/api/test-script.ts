import prisma from './src/db/client.js';

async function test() {
  try {
    const order = await prisma.order.update({
      where: { id: "4f7b86d1-1241-4ef2-b1f9-ece9abde9914" },
      data: {
        status: "cancelled",
        cancelledAt: new Date()
      } as any
    });
    console.log("Success:", order);
  } catch (e: any) {
    console.error("Error with cancelledAt:", e.message);
  }
}
test().finally(() => prisma.$disconnect());
