/** Returns true if price is a positive finite number. */
export function isValidPrice(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0
}

/** Returns true if quantity is a non-negative integer. */
export function isValidQuantity(value) {
  const num = Number(value)
  return Number.isInteger(num) && num >= 0
}

/** Returns true if value is a valid URL slug (lowercase, hyphens, no spaces). */
export function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value))
}
