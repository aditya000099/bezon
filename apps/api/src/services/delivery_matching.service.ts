import prisma from '../db/client.js';
import { Prisma } from '@prisma/client';

/**
 * Utility to calculate the geocoded distance between two coordinate pairs in kilometers (Haversine formula)
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export class DeliveryMatchingService {
  /**
   * Automatically matches the closest available delivery partner to an order's shop location
   */
  static async assignDeliveryPartner(orderId: string) {
    try {
      console.log(`[DeliveryMatching] Starting courier allocation for Order ID: ${orderId}`);

      // 1. Fetch the Order details, including the Seller details (with location)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          seller: true,
        },
      });

      if (!order) {
        console.error(`[DeliveryMatching] Order ${orderId} not found.`);
        return null;
      }

      const shop = order.seller;
      if (!shop) {
        console.error(`[DeliveryMatching] Seller profile not found for order ${orderId}.`);
        return null;
      }

      let targetLat = shop.lat ? Number(shop.lat) : null;
      let targetLng = shop.lng ? Number(shop.lng) : null;

      const isCustomerCentricFlow = ['return_approved', 'refund_approved', 'replacement_approved'].includes(order.status);
      if (isCustomerCentricFlow) {
        const addr = order.addressSnapshot as any;
        let custLat = addr?.lat ? Number(addr.lat) : null;
        let custLng = addr?.lng ? Number(addr.lng) : null;

        // Fallback: Query from Address table if snapshot coordinates are missing
        if (custLat === null || custLng === null) {
          const originalAddress = await prisma.address.findUnique({
            where: { id: order.addressId },
          });
          if (originalAddress) {
            custLat = originalAddress.lat ? Number(originalAddress.lat) : null;
            custLng = originalAddress.lng ? Number(originalAddress.lng) : null;
          }
        }

        if (custLat !== null && custLng !== null) {
          targetLat = custLat;
          targetLng = custLng;
          console.log(`[DeliveryMatching] Customer-centric flow (${order.status}) - matching courier near customer coordinates (${custLat}, ${custLng}).`);
        }
      }

      if (targetLat === null || targetLng === null) {
        console.log(`[DeliveryMatching] Shop/Customer location coordinates not configured. Skipping auto-matching.`);
        return await this.createUnassignedDelivery(orderId);
      }

      // 2. Query all online/available delivery partners
      const availablePartners = await prisma.deliveryPartner.findMany({
        where: {
          isAvailable: true,
        },
      });

      if (availablePartners.length === 0) {
        console.log(`[DeliveryMatching] No available delivery partners online. Creating unassigned delivery task.`);
        return await this.createUnassignedDelivery(orderId);
      }

      // 3. Filter partners with coordinates and map them to their distance from the shop
      const partnersWithDistance = availablePartners
        .map((partner) => {
          const pLat = partner.currentLat ? Number(partner.currentLat) : partner.lat ? Number(partner.lat) : null;
          const pLng = partner.currentLng ? Number(partner.currentLng) : partner.lng ? Number(partner.lng) : null;

          if (pLat === null || pLng === null) {
            return null;
          }

          const distance = calculateDistanceKm(targetLat, targetLng, pLat, pLng);
          return { partner, distance };
        })
        .filter((item): item is { partner: typeof availablePartners[0]; distance: number } => item !== null);

      if (partnersWithDistance.length === 0) {
        console.log(`[DeliveryMatching] No online partners have location coordinates configured. Creating unassigned delivery.`);
        return await this.createUnassignedDelivery(orderId);
      }

      // 4. Sort by distance (ascending) and pick the closest partner
      partnersWithDistance.sort((a, b) => a.distance - b.distance);
      const bestMatch = partnersWithDistance[0];

      console.log(
        `[DeliveryMatching] Best match for Order ${orderId}: Partner ID ${bestMatch.partner.id} at distance ${bestMatch.distance.toFixed(
          2
        )} km`
      );

      // 5. Create a Delivery record assigned to the chosen partner
      const delivery = await prisma.delivery.create({
        data: {
          orderId,
          partnerId: bestMatch.partner.id,
          status: 'assigned',
          assignedAt: new Date(),
        },
      });

      // 6. Log Timeline events for both Delivery and Order
      await prisma.deliveryTimeline.create({
        data: {
          deliveryId: delivery.id,
          status: 'assigned',
          note: `System automatically matched order to courier (Distance: ${bestMatch.distance.toFixed(2)} km)`,
        },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId,
          status: order.status as any,
          note: `Delivery assigned to partner (Distance: ${bestMatch.distance.toFixed(2)} km)`,
        },
      });

      // 7. Create a notification for the delivery partner
      await prisma.notification.create({
        data: {
          userId: bestMatch.partner.userId,
          title: 'New Delivery Assignment',
          body: `You have been assigned a new delivery task (Order ${order.orderNumber}). Click to view details.`,
          type: 'new_task_assigned',
        },
      });

      return delivery;
    } catch (err) {
      console.error('[DeliveryMatching] Error in delivery auto-matching:', err);
      // Ensure we still try to create an unassigned delivery as a last resort fallback
      try {
        return await this.createUnassignedDelivery(orderId);
      } catch (fallbackErr) {
        console.error('[DeliveryMatching] Fallback unassigned delivery creation failed:', fallbackErr);
        return null;
      }
    }
  }

  /**
   * Helper to create an unassigned delivery task when no match is possible
   */
  private static async createUnassignedDelivery(orderId: string) {
    const existing = await prisma.delivery.findUnique({
      where: { orderId },
    });

    if (existing) return existing;

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        partnerId: null,
        status: 'assigned', // Still 'assigned' status, but partnerId is null (waiting for courier)
        assignedAt: new Date(),
      },
    });

    await prisma.deliveryTimeline.create({
      data: {
        deliveryId: delivery.id,
        status: 'assigned',
        note: 'Order ready for delivery. Waiting for a nearby courier to log online.',
      },
    });

    return delivery;
  }

  /**
   * Cron job running periodically to assign unassigned deliveries to the nearest workload-balanced partner
   */
  static async runCronAssignmentJob() {
    try {
      console.log(`[DeliveryCron] Running unassigned delivery allocator job...`);

      // 1. Fetch all unassigned deliveries in 'assigned' status (waiting for courier)
      const unassignedDeliveries = await prisma.delivery.findMany({
        where: {
          partnerId: null,
          status: 'assigned',
        },
        include: {
          order: {
            include: {
              seller: true,
            },
          },
        },
      });

      if (unassignedDeliveries.length === 0) {
        return;
      }

      console.log(`[DeliveryCron] Found ${unassignedDeliveries.length} unassigned deliveries.`);

      // 2. Fetch all online delivery partners
      const availablePartners = await prisma.deliveryPartner.findMany({
        where: {
          isAvailable: true,
        },
      });

      if (availablePartners.length === 0) {
        console.log(`[DeliveryCron] No delivery partners online right now.`);
        return;
      }

      // 3. Compute active workloads for each partner (in DB)
      const activeCounts: Record<string, number> = {};
      for (const partner of availablePartners) {
        const count = await prisma.delivery.count({
          where: {
            partnerId: partner.id,
            status: {
              in: ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'],
            },
          },
        });
        activeCounts[partner.id] = count;
      }

      // 4. Process each unassigned delivery
      for (const delivery of unassignedDeliveries) {
        const shop = delivery.order?.seller;
        if (!shop) continue;

        let targetLat = shop.lat ? Number(shop.lat) : null;
        let targetLng = shop.lng ? Number(shop.lng) : null;

        const isCustomerCentricFlow = ['return_approved', 'refund_approved', 'replacement_approved'].includes(delivery.order?.status);
        if (isCustomerCentricFlow) {
          const addr = delivery.order?.addressSnapshot as any;
          let custLat = addr?.lat ? Number(addr.lat) : null;
          let custLng = addr?.lng ? Number(addr.lng) : null;

          // Fallback: Query from Address table if snapshot coordinates are missing
          if ((custLat === null || custLng === null) && delivery.order?.addressId) {
            const originalAddress = await prisma.address.findUnique({
              where: { id: delivery.order.addressId },
            });
            if (originalAddress) {
              custLat = originalAddress.lat ? Number(originalAddress.lat) : null;
              custLng = originalAddress.lng ? Number(originalAddress.lng) : null;
            }
          }

          if (custLat !== null && custLng !== null) {
            targetLat = custLat;
            targetLng = custLng;
          }
        }

        if (targetLat === null || targetLng === null) {
          console.warn(`[DeliveryCron] Target coordinates not configured. Skipping.`);
          continue;
        }

        const candidates = availablePartners
          .map((partner) => {
            const pLat = partner.currentLat ? Number(partner.currentLat) : partner.lat ? Number(partner.lat) : null;
            const pLng = partner.currentLng ? Number(partner.currentLng) : partner.lng ? Number(partner.lng) : null;

            if (pLat === null || pLng === null) return null;

            const distance = calculateDistanceKm(targetLat, targetLng, pLat, pLng);
            return { partner, distance };
          })
          .filter((item): item is { partner: typeof availablePartners[0]; distance: number } => item !== null);

        if (candidates.length === 0) {
          continue;
        }

        // 5. Workload-Aware Proximity Sort
        // Primary sort: Workload (ascending) to distribute orders evenly.
        // Secondary sort: Distance (ascending) to assign the closest one.
        candidates.sort((a, b) => {
          const loadA = activeCounts[a.partner.id] || 0;
          const loadB = activeCounts[b.partner.id] || 0;
          if (loadA !== loadB) {
            return loadA - loadB;
          }
          return a.distance - b.distance;
        });

        // 6. Assign the best candidate
        const bestMatch = candidates[0];
        
        // We set a threshold workload (e.g. at most 3 stacked orders). If the best candidate is already overloaded (>= 3), we can skip.
        const workload = activeCounts[bestMatch.partner.id] || 0;
        if (workload >= 3) {
          console.log(`[DeliveryCron] All nearby couriers are fully overloaded (>= 3 active). Postponing order ${delivery.order?.orderNumber}.`);
          continue;
        }

        console.log(
          `[DeliveryCron] Matching Order ${delivery.order?.orderNumber} to Partner ${bestMatch.partner.id} (Distance: ${bestMatch.distance.toFixed(
            2
          )} km, Load: ${workload})`
        );

        // Run DB update
        await prisma.$transaction(async (tx) => {
          await tx.delivery.update({
            where: { id: delivery.id },
            data: {
              partnerId: bestMatch.partner.id,
              assignedAt: new Date(),
            },
          });

          await tx.deliveryTimeline.create({
            data: {
              deliveryId: delivery.id,
              status: 'assigned',
              note: `Workload-balanced match to nearest courier (Distance: ${bestMatch.distance.toFixed(2)} km, current load: ${workload})`,
            },
          });

          await tx.orderTimeline.create({
            data: {
              orderId: delivery.orderId,
              status: delivery.order.status as any,
              note: `Delivery assigned to partner (Distance: ${bestMatch.distance.toFixed(2)} km)`,
            },
          });

          await tx.notification.create({
            data: {
              userId: bestMatch.partner.userId,
              title: 'New Delivery Assignment',
              body: `You have been assigned a new delivery task (Order ${delivery.order?.orderNumber}). Click to view details.`,
              type: 'new_task_assigned',
            },
          });
        });

        // Increment their workload in memory so subsequent assignments in this cron tick recognize this partner's new workload!
        activeCounts[bestMatch.partner.id] = workload + 1;
      }
    } catch (err) {
      console.error(`[DeliveryCron] Error running unassigned delivery matching cron job:`, err);
    }
  }
}
