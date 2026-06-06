import prisma from "../db/client.js";
import { RETURN_WINDOW_DAYS } from "../utils/constants.js";

export class OrderService {
  /**
   * Retrieves orders based on caller's role (customer, seller, admin)
   */
  static async getOrders(
    user: { id: string; role: string },
    filters: any = {},
  ) {
    const { id: userId, role } = user;

    if (role === "customer") {
      return await prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: true,
          seller: {
            select: {
              shopName: true,
              shopSlug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (role === "seller") {
      const seller = await prisma.seller.findUnique({
        where: { userId },
      });

      if (!seller) {
        const err = new Error("Seller profile required.");
        (err as any).status = 403;
        throw err;
      }

      const where: any = { sellerId: seller.id };
      if (filters.returnStatus) {
        where.returnStatus = filters.returnStatus;
      }

      return await prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (role === "admin") {
      const where: any = {};
      if (filters.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
      }
      if (filters.returnStatus) {
        where.returnStatus = filters.returnStatus;
      }

      return await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          seller: {
            select: {
              shopName: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          delivery: {
            include: {
              partner: {
                include: {
                  user: {
                    select: {
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          returnPartner: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return [];
  }

  /**
   * Retrieves order details, validating accessibility by caller
   */
  static async getOrderById(
    orderId: string,
    user: { id: string; role: string },
  ) {
    const { id: userId, role } = user;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true,
                  },
                },
              },
            },
            review: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err = new Error("Order reference not found.");
      (err as any).status = 404;
      throw err;
    }

    if (role === "customer" && order.customerId !== userId) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    if (role === "seller") {
      const seller = await prisma.seller.findUnique({
        where: { userId },
      });
      if (!seller || order.sellerId !== seller.id) {
        const err = new Error("Access denied.");
        (err as any).status = 403;
        throw err;
      }
    }

    return order;
  }

  /**
   * Updates the status of an order and records the change in the timeline
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    user: { id: string; role: string },
  ) {
    const { id: userId, role } = user;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (role === "seller") {
      const seller = await prisma.seller.findUnique({ where: { userId } });
      if (!seller || order.sellerId !== seller.id) {
        const err = new Error("Access denied.");
        (err as any).status = 403;
        throw err;
      }
    }

    // Admin can always update
    if (role === "customer") {
      const err = new Error("Customers cannot directly modify order status.");
      (err as any).status = 403;
      throw err;
    }

    const validTransitions: Record<string, string[]> = {
      placed: ["confirmed", "cancelled"],
      confirmed: ["packed", "ready_for_pickup", "cancelled"],
      packed: ["ready_for_pickup", "cancelled"],
      ready_for_pickup: ["cancelled"],
      shipped: ["out_for_delivery", "delivery_failed"],
      out_for_delivery: ["delivered", "delivery_failed"],
      delivered: [
        "return_requested",
        "refund_requested",
        "replacement_requested",
      ],

      // Return flow
      return_requested: ["return_approved", "return_rejected"],
      return_approved: ["returned_to_origin"],
      returned_to_origin: [
        "refund_requested",
        "refunding",
        "refunded",
        "replacement_approved",
      ],

      // Refund flow
      refund_requested: ["refund_approved", "refund_rejected"],
      refund_approved: ["refunded"],
      refunding: ["refunded"],

      // Replacement flow
      replacement_requested: ["replacement_approved", "replacement_rejected"],
      replacement_approved: ["replacement_shipped"],
      replacement_shipped: ["replaced"],
    };

    if (order.status === status) {
      const err = new Error(`Order is already in state "${status}".`);
      (err as any).status = 400;
      throw err;
    }

    if (role !== "admin") {
      const allowed = validTransitions[order.status];
      if (!allowed || !allowed.includes(status)) {
        const err = new Error(
          `Cannot transition order status from "${order.status}" to "${status}".`,
        );
        (err as any).status = 400;
        throw err;
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const isPolicyApproval = [
        "return_approved",
        "refund_approved",
        "replacement_approved",
      ].includes(status);
      if (isPolicyApproval) {
        await tx.delivery.deleteMany({
          where: { orderId },
        });
      }

      const updateData: any = { status: status as any };
      if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      // Build a human-readable timeline note
      const statusLabel = status.replace(/_/g, " ");
      let timelineNote = `Order status updated to ${statusLabel}.`;
      if (role === "seller") {
        timelineNote = `Seller updated order to ${statusLabel}.`;
      } else if (role === "admin") {
        timelineNote = `Admin updated order to ${statusLabel}.`;
      }

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: status as any,
          note: timelineNote,
          actorId: userId,
          actorRole: role as any,
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  /**
   * Processes a customer-initiated policy action (return/refund/replace) for an order item
   */
  static async requestOrderPolicyAction(
    orderId: string,
    actionType: "return" | "refund" | "replace",
    itemId: string,
    reason: string,
    user: { id: string; role: string },
  ) {
    const { id: userId, role } = user;

    // Retrieve order detail, ensuring accessibility checks
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true,
                  },
                },
              },
            },
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    // Access control: only the customer who ordered or admin
    if (role === "customer" && order.customerId !== userId) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== "delivered") {
      const err = new Error(
        "Policy actions are only available for delivered orders.",
      );
      (err as any).status = 400;
      throw err;
    }

    const orderItem = order.items.find((item) => item.id === itemId);
    if (!orderItem) {
      const err = new Error("Item not found in this order.");
      (err as any).status = 404;
      throw err;
    }

    // Find the corresponding policy for this actionType
    const productPolicies = orderItem.product?.policies || [];
    const matchingProductPolicy = productPolicies.find(
      (pp) => pp.policy?.type === actionType,
    );

    if (!matchingProductPolicy || !matchingProductPolicy.policy) {
      const err = new Error(
        `This item does not support a ${actionType} policy.`,
      );
      (err as any).status = 400;
      throw err;
    }

    const policy = matchingProductPolicy.policy;

    if (!policy.isActive) {
      const err = new Error(`The ${actionType} policy is currently inactive.`);
      (err as any).status = 400;
      throw err;
    }

    // Check durationDays limit from deliveredAt
    const deliveredAt = order.delivery?.deliveredAt;
    if (!deliveredAt) {
      const err = new Error("Delivery timestamp is missing.");
      (err as any).status = 400;
      throw err;
    }

    const deliveryTime = new Date(deliveredAt).getTime();
    const expirationTime =
      deliveryTime + policy.durationDays * 24 * 60 * 60 * 1000;
    if (Date.now() > expirationTime) {
      const err = new Error(
        `The ${policy.durationDays}-day window for this ${actionType} policy has expired.`,
      );
      (err as any).status = 400;
      throw err;
    }

    // Map action type to order status
    let targetStatus: any;
    if (actionType === "refund") {
      targetStatus = "refund_requested";
    } else if (actionType === "replace") {
      targetStatus = "replacement_requested";
    } else {
      targetStatus = "return_requested";
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: targetStatus,
          note: `${actionType.toUpperCase()} requested for item "${orderItem.productTitle}". Reason: ${reason || "Not specified"}.`,
        },
      });

      return updated;
    });

    return updatedOrder;
  }
  /**
   * Retrieves orders for a specific seller by their user ID
   */
  static async getSellerOrders(
    userId: string,
    filters: { returnStatus?: string; returnInspectionStatus?: string } = {},
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error("Seller profile required.");
      (err as any).status = 403;
      throw err;
    }

    const whereClause: any = { sellerId: seller.id };

    if (filters.returnStatus) {
      if (filters.returnStatus.includes(",")) {
        whereClause.returnStatus = { in: filters.returnStatus.split(",") };
      } else {
        whereClause.returnStatus = filters.returnStatus;
      }
    }

    if (filters.returnInspectionStatus) {
      if (filters.returnInspectionStatus === "INSPECTED_ALL") {
        whereClause.returnInspectionStatus = { not: "PENDING_INSPECTION" };
      } else {
        whereClause.returnInspectionStatus = filters.returnInspectionStatus;
      }
    }

    return await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { product: true } },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        returnPartner: {
          include: { user: true },
        },
        timeline: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves specific order details for a seller
   */
  static async getSellerOrderById(orderId: string, userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error("Seller profile required.");
      (err as any).status = 403;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true,
                  },
                },
              },
            },
            review: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        returnPartner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err = new Error("Order reference not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    return order;
  }

  /**
   * Cancels a customer order before fulfillment begins
   */
  static async cancelCustomerOrder(
    orderId: string,
    customerId: string,
    cancelReason?: string,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.customerId !== customerId) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== "placed" && order.status !== "confirmed") {
      const err = new Error("Order can no longer be cancelled.");
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      let nextPaymentStatus = order.paymentStatus;
      if (order.paymentStatus === "paid") {
        nextPaymentStatus = "refund_initiated";
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "cancelled",
          paymentStatus: nextPaymentStatus,
          cancelReason: cancelReason || null,
          cancelledAt: new Date(),
          cancelledBy: customerId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          note: `Customer cancelled the order. ${cancelReason ? `Reason: ${cancelReason}` : ""}`,
          actorId: customerId,
          actorRole: "customer",
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Cancel an order by a seller
   */
  static async cancelSellerOrder(
    orderId: string,
    userId: string,
    cancelReason?: string,
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error("Seller profile not found.");
      (err as any).status = 404;
      throw err;
    }

    // Pre-flight check
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    const ALLOWED_STATUSES = ["placed", "confirmed", "packed"];
    if (!ALLOWED_STATUSES.includes(order.status)) {
      const err = new Error("Order can no longer be cancelled.");
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction with a lock/check to prevent race conditions
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || !ALLOWED_STATUSES.includes(currentOrder.status)) {
        throw Object.assign(
          new Error("Order state changed. Cancellation aborted."),
          { status: 409 },
        );
      }

      let nextPaymentStatus = currentOrder.paymentStatus;
      if (currentOrder.paymentStatus === "paid") {
        nextPaymentStatus = "refund_initiated";
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "cancelled",
          paymentStatus: nextPaymentStatus,
          cancelReason: cancelReason || null,
          cancelledAt: new Date(),
          cancelledBy: seller.id,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          note: `Seller cancelled the order. ${cancelReason ? `Reason: ${cancelReason}` : ""}`,
          actorId: seller.userId,
          actorRole: "seller",
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Mark a pending refund as completed
   */
  static async markRefundCompleted(orderId: string, adminId: string) {
    // Pre-flight check
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.status !== "cancelled") {
      const err = new Error(
        "Refunds can only be processed for cancelled orders.",
      );
      (err as any).status = 400;
      throw err;
    }

    if (order.paymentStatus === "refunded") {
      const err = new Error("Refund has already been completed.");
      (err as any).status = 400; // Return 400 for idempotency handling in UI
      throw err;
    }

    if (order.paymentStatus !== "refund_initiated") {
      const err = new Error("Order is not pending a refund.");
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction lock
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (
        !currentOrder ||
        currentOrder.status !== "cancelled" ||
        currentOrder.paymentStatus !== "refund_initiated"
      ) {
        throw Object.assign(new Error("Order state changed. Refund aborted."), {
          status: 409,
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "refunded",
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          note: `Admin marked refund as completed. Status changed from refund_initiated to refunded.`,
          actorId: adminId,
          actorRole: "admin",
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Phase 5 - Request a return (Customer)
   */
  static async requestReturn(
    orderId: string,
    customerId: string,
    reason: string,
    notes?: string,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
        timeline: {
          where: { status: "delivered" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.customerId !== customerId) {
      const err = new Error("Access denied.");
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== "delivered") {
      const err = new Error("Only delivered orders can be returned.");
      (err as any).status = 400;
      throw err;
    }

    if (order.returnStatus && order.returnStatus !== "NONE") {
      const err = new Error(
        "A return request has already been initiated for this order.",
      );
      (err as any).status = 400;
      throw err;
    }

    const deliveredAt =
      order.deliveredAt ||
      order.delivery?.deliveredAt ||
      order.timeline?.[0]?.createdAt;

    if (!deliveredAt) {
      const err = new Error(
        "Delivery timestamp is missing, cannot calculate return window.",
      );
      (err as any).status = 400;
      throw err;
    }

    const deliveryTime = new Date(deliveredAt).getTime();
    const expirationTime =
      deliveryTime + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    if (Date.now() > expirationTime) {
      const err = new Error(
        `The ${RETURN_WINDOW_DAYS}-day return window has expired.`,
      );
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: "REQUESTED",
          returnReason: reason as any,
          returnNotes: notes || null,
          returnRequestedAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "delivered", // Keeping main status as delivered
          note: `Return Requested by Customer. Reason: ${reason}.`,
          actorId: customerId,
          actorRole: "customer",
        },
      });

      // Notification hook placeholder
      // NotificationService.createNotification(...)

      return updatedOrder;
    });
  }

  /**
   * Phase 5 - Approve a return (Seller)
   */
  static async approveReturn(orderId: string, sellerUserId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      const err = new Error("Seller profile not found.");
      (err as any).status = 404;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error("Access denied. You do not own this order.");
      (err as any).status = 403;
      throw err;
    }

    if (order.returnStatus !== "REQUESTED") {
      const err = new Error("Only pending return requests can be approved.");
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.returnStatus !== "REQUESTED") {
        throw Object.assign(
          new Error("Order state changed. Approval aborted."),
          { status: 409 },
        );
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: "APPROVED",
          returnApprovedAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "delivered", // Keep main status as delivered
          note: `Return Approved by Seller.`,
          actorId: seller.userId,
          actorRole: "seller",
        },
      });

      // Notification hook placeholder
      // NotificationService.createNotification(...)

      return updatedOrder;
    });
  }

  /**
   * Phase 5 - Reject a return (Seller)
   */
  static async rejectReturn(
    orderId: string,
    sellerUserId: string,
    rejectionReason: string,
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      const err = new Error("Seller profile not found.");
      (err as any).status = 404;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error("Order not found.");
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error("Access denied. You do not own this order.");
      (err as any).status = 403;
      throw err;
    }

    if (order.returnStatus !== "REQUESTED") {
      const err = new Error("Only pending return requests can be rejected.");
      (err as any).status = 400;
      throw err;
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      const err = new Error("Rejection reason is required.");
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.returnStatus !== "REQUESTED") {
        throw Object.assign(
          new Error("Order state changed. Rejection aborted."),
          { status: 409 },
        );
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: "REJECTED",
          returnRejectedAt: new Date(),
          returnRejectedReason: rejectionReason.trim(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "delivered", // Keep main status as delivered
          note: `Return Rejected by Seller. Reason: ${rejectionReason.trim()}.`,
          actorId: seller.userId,
          actorRole: "seller",
        },
      });

      // Notification hook placeholder
      // NotificationService.createNotification(...)

      return updatedOrder;
    });
  }

  /**
   * Inspects a returned product and updates its inspection status.
   */
  static async inspectReturnedProduct(
    orderId: string,
    sellerUserId: string,
    status: "RESTOCKED" | "DAMAGED" | "DISPOSED",
    notes: string | null,
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      throw Object.assign(new Error("Seller profile not found."), {
        status: 403,
      });
    }

    if (
      (status === "DAMAGED" || status === "DISPOSED") &&
      (!notes || notes.trim() === "")
    ) {
      throw Object.assign(
        new Error(
          "Inspection notes are required when marking a product as DAMAGED or DISPOSED.",
        ),
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found."), { status: 404 });
    }

    if (order.sellerId !== seller.id) {
      throw Object.assign(
        new Error("Access denied. You do not own this order."),
        { status: 403 },
      );
    }

    if (order.returnStatus !== "COMPLETED") {
      throw Object.assign(
        new Error("Only completed returns can be inspected."),
        { status: 400 },
      );
    }

    if (order.returnInspectionStatus !== "PENDING_INSPECTION") {
      throw Object.assign(
        new Error("This return has already been inspected."),
        { status: 400 },
      );
    }

    return await prisma.$transaction(async (tx) => {
      const refundAmount = Number(order.subtotal) - Number(order.discount);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnInspectionStatus: status,
          returnInspectionNotes: notes,
          returnInspectedAt: new Date(),
          returnInspectedById: seller.id,
          refundStatus: "READY",
          refundAmount: refundAmount,
          refundEligibleAt: new Date(),
        },
      });

      let statusWord = "";
      if (status === "RESTOCKED") statusWord = "Restocked";
      if (status === "DAMAGED") statusWord = "Damaged";
      if (status === "DISPOSED") statusWord = "Disposed";

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "delivered", // Keep main status as delivered
          note: `Product Marked ${statusWord} By Seller.`,
          actorId: seller.userId,
          actorRole: "seller",
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "delivered",
          note: `Refund Eligible`,
          actorId: seller.userId,
          actorRole: "seller",
        },
      });

      if (status === "RESTOCKED") {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product && product.sellerId === seller.id) {
            const previousStock = product.totalStock;
            const returnedQty = item.qty;
            const newStock = previousStock + returnedQty;

            await tx.product.update({
              where: { id: product.id },
              data: { totalStock: newStock },
            });

            await tx.orderTimeline.create({
              data: {
                orderId: order.id,
                status: "delivered",
                note: `Inventory Increased +${returnedQty} (Stock Updated: ${previousStock} → ${newStock})`,
                actorId: seller.userId,
                actorRole: "seller",
              },
            });
          }
        }
      }

      return updatedOrder;
    });
  }

  /**
   * Helper query for Phase 7 Refunds:
   * Retrieve returns that are physically completed and have been inspected by the seller.
   */
  static async getRefundEligibleReturns() {
    return await prisma.order.findMany({
      where: {
        returnStatus: "COMPLETED",
        returnInspectionStatus: {
          not: "PENDING_INSPECTION",
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });
  }

  // Phase 7: Automatic Refund Workflow Simulation

  static async simulateRefundProcessing(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      throw Object.assign(new Error("Order not found"), { status: 404 });
    const isLegacyReady = order.refundStatus === "NONE" && order.returnStatus === "COMPLETED" && order.returnInspectionStatus !== "PENDING_INSPECTION";
    if (order.refundStatus !== "READY" && !isLegacyReady)
      throw Object.assign(new Error("Order is not ready for refund"), {
        status: 400,
      });

    return await prisma.$transaction(async (tx) => {
      const refundAmountToSet = order.refundAmount ? order.refundAmount : (Number(order.subtotal) - Number(order.discount));

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: "PROCESSING",
          refundAmount: refundAmountToSet,
          refundInitiatedAt: new Date(),
          refundProcessedById: adminId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: "Refund Processing",
          actorId: adminId,
          actorRole: "admin",
        },
      });
      return updated;
    });
  }

  static async simulateRefundCompleted(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      throw Object.assign(new Error("Order not found"), { status: 404 });
    if (order.refundStatus !== "PROCESSING")
      throw Object.assign(new Error("Refund is not currently processing"), {
        status: 400,
      });

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: "COMPLETED",
          refundedAt: new Date(),
          refundProcessedById: adminId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: `Refund Completed - ₹${order.refundAmount}`,
          actorId: adminId,
          actorRole: "admin",
        },
      });
      return updated;
    });
  }

  static async simulateRefundFailed(
    orderId: string,
    adminId: string,
    reason: string,
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      throw Object.assign(new Error("Order not found"), { status: 404 });
    if (order.refundStatus !== "PROCESSING")
      throw Object.assign(new Error("Refund is not currently processing"), {
        status: 400,
      });

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: "FAILED",
          refundFailureReason: reason,
          refundProcessedById: adminId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: `Refund Failed - ${reason}`,
          actorId: adminId,
          actorRole: "admin",
        },
      });
      return updated;
    });
  }
}
