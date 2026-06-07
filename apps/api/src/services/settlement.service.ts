import prisma from "../db/client.js";
import { WalletService } from "./wallet.service.js";

export class SettlementService {
  static async processSettlements() {
    console.log("[SettlementService] Starting settlement processing...");

    // Find all potential orders (delivered and holding)
    const orders = await prisma.order.findMany({
      where: {
        status: "delivered",
        settlementStatus: "HOLDING",
        refundStatus: { not: "COMPLETED" },
        returnStatus: { in: ["NONE", "REJECTED"] },
      },
      include: {
        seller: { select: { userId: true, id: true, shopName: true } },
      },
    });

    const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!adminUser) {
      console.error(
        "[SettlementService] No admin user found for escrow processing.",
      );
      return {
        processedCount: 0,
        failedCount: 0,
        message: "Admin user not found",
      };
    }

    let processedCount = 0;
    let failedCount = 0;
    const now = new Date();

    const returnPolicy = await prisma.policy.findFirst({
      where: { type: 'return', isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    const returnWindowDays = returnPolicy?.durationDays || 7;

    for (const order of orders) {
      try {
        // Calculate delivery time
        const deliveredAt = order.deliveredAt;
        if (!deliveredAt) {
          // Fallback to searching the timeline for delivery event
          const timeline = await prisma.orderTimeline.findFirst({
            where: { orderId: order.id, status: "delivered" },
            orderBy: { createdAt: "desc" },
          });

          if (!timeline) {
            console.log(
              `[SettlementService] Order ${order.orderNumber} missing delivery timestamp. Skipping.`,
            );
            continue;
          }
          order.deliveredAt = timeline.createdAt;
        }

        const deliveryTime = new Date(order.deliveredAt!).getTime();
        const expirationTime =
          deliveryTime + returnWindowDays * 24 * 60 * 60 * 1000;

        if (now.getTime() > expirationTime) {
          // Order is eligible for settlement!
          const settlementAmount = order.settlementAmount
            ? Number(order.settlementAmount)
            : 0;

          if (settlementAmount > 0) {
            await prisma.$transaction(async (tx) => {
              // Mark order as SETTLED
              await tx.order.update({
                where: { id: order.id },
                data: {
                  settlementStatus: "SETTLED",
                  settledAt: new Date(),
                  settlementReleasedAt: new Date(),
                },
              });

              // Add Timeline events
              await tx.orderTimeline.create({
                data: {
                  orderId: order.id,
                  status: order.status,
                  note: `Settlement Eligible`,
                  actorId: adminUser.id,
                  actorRole: "admin",
                },
              });

              await tx.orderTimeline.create({
                data: {
                  orderId: order.id,
                  status: order.status,
                  note: `Settlement Released - ₹${settlementAmount}`,
                  actorId: adminUser.id,
                  actorRole: "admin",
                },
              });
            });

            // Perform Wallet Transactions (Admin Debit, Seller Credit)
            // Note: If debit fails, we should technically revert the settlementStatus,
            // but Prisma nested tx across services is tricky.
            // We'll perform wallet updates sequentially.
            try {
              // 1. Debit Escrow Wallet (Admin)
              await WalletService.debitWallet(
                adminUser.id,
                settlementAmount,
                "seller_settlement",
                order.id,
                `Settlement released to seller for order #${order.orderNumber}`,
              );

              // 2. Credit Seller Wallet
              await WalletService.creditWallet(
                order.seller.userId,
                settlementAmount,
                "order_settlement",
                order.id,
                `Settlement received for order #${order.orderNumber} (₹${settlementAmount})`,
              );
            } catch (walletErr) {
              console.error(
                `[SettlementService] Wallet tx failed for order ${order.orderNumber}:`,
                walletErr,
              );
              // Revert settlement status on failure
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  settlementStatus: "HOLDING",
                  settledAt: null,
                  settlementReleasedAt: null,
                },
              });
              await prisma.orderTimeline.create({
                data: {
                  orderId: order.id,
                  status: order.status,
                  note: `Settlement Failed - Wallet Error`,
                },
              });
              throw walletErr;
            }

            processedCount++;
            console.log(
              `[SettlementService] Successfully settled ₹${settlementAmount} for order ${order.orderNumber}`,
            );
          } else {
            console.log(
              `[SettlementService] Order ${order.orderNumber} has zero settlement amount. Skipping.`,
            );
          }
        }
      } catch (err) {
        console.error(
          `[SettlementService] Error processing order ${order.id}:`,
          err,
        );
        failedCount++;
      }
    }

    console.log(
      `[SettlementService] Processing complete. Settled: ${processedCount}, Failed: ${failedCount}`,
    );
    return {
      processedCount,
      failedCount,
      message: "Settlement processing completed",
    };
  }
}
