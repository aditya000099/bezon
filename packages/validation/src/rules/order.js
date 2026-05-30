const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']

/** Returns true if value is one of the allowed order status strings. */
export function isValidOrderStatus(value) {
  return ORDER_STATUSES.includes(value)
}
