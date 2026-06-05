import prisma from './apps/api/src/db/client.js';

async function test() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        addressSnapshot: {
          path: ['city'],
          equals: 'Mumbai'
        }
      },
      take: 1
    });
    console.log("Success:", orders.length);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
