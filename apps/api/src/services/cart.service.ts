import prisma from '../db/client.js';

export class CartService {
  /**
   * Retrieves or automatically provisions a cart for a user
   */
  static async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Adds an item to the shopping cart or increments quantity
   */
  static async addCartItem(userId: string, data: {
    productId: string;
    qty: number;
    priceSnapshot: number;
  }) {
    const { productId, qty, priceSnapshot } = data;

    // Resolve cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Verify product exists and check stock levels
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'published') {
      const err = new Error('Product not found or not available.');
      (err as any).status = 404;
      throw err;
    }

    if (product.totalStock < Number(qty)) {
      const err = new Error(`Insufficient stock available. Only ${product.totalStock} units remaining.`);
      (err as any).status = 422;
      throw err;
    }

    // Check if the item is already present in the cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      const newQty = existingItem.qty + Number(qty);
      if (product.totalStock < newQty) {
        const err = new Error(`Cannot add more units. Total requested quantity (${newQty}) exceeds available stock (${product.totalStock}).`);
        (err as any).status = 422;
        throw err;
      }

      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: newQty },
      });
    }

    // Add new item
    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        qty: Number(qty),
        priceSnapshot: Number(priceSnapshot),
      },
    });
  }

  /**
   * Modifies the quantity of a cart item
   */
  static async updateCartItemQty(userId: string, itemId: string, qty: number) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!item) {
      const err = new Error('Cart item not found.');
      (err as any).status = 404;
      throw err;
    }

    if (item.cart.userId !== userId) {
      const err = new Error('Unauthorized action.');
      (err as any).status = 403;
      throw err;
    }

    if (item.product.totalStock < Number(qty)) {
      const err = new Error(`Insufficient stock. Only ${item.product.totalStock} units available.`);
      (err as any).status = 422;
      throw err;
    }

    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { qty: Number(qty) },
    });
  }

  /**
   * Removes a cart item
   */
  static async removeCartItem(userId: string, itemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item) {
      const err = new Error('Cart item not found.');
      (err as any).status = 404;
      throw err;
    }

    if (item.cart.userId !== userId) {
      const err = new Error('Unauthorized action.');
      (err as any).status = 403;
      throw err;
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}
