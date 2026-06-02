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

      const shopLat = shop.lat ? Number(shop.lat) : null;
      const shopLng = shop.lng ? Number(shop.lng) : null;

      if (shopLat === null || shopLng === null) {
        console.log(`[DeliveryMatching] Shop "${shop.shopName}" has no address/coordinates configured. Skipping auto-matching.`);
        // Fallback: Create a delivery record with no partner assigned
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
          // Use real-time current location if available, otherwise fallback to home address location
          const pLat = partner.currentLat ? Number(partner.currentLat) : partner.lat ? Number(partner.lat) : null;
          const pLng = partner.currentLng ? Number(partner.currentLng) : partner.lng ? Number(partner.lng) : null;

          if (pLat === null || pLng === null) {
            return null;
          }

          const distance = calculateDistanceKm(shopLat, shopLng, pLat, pLng);
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
          status: 'confirmed',
          note: `Delivery assigned to partner (Distance: ${bestMatch.distance.toFixed(2)} km)`,
        },
      });

      // 7. Create a notification for the delivery partner
      await prisma.notification.create({
        data: {
          userId: bestMatch.partner.userId,
          title: 'New Delivery Assignment',
          message: `You have been assigned a new delivery task (Order ${order.orderNumber}). Click to view details.`,
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
}
