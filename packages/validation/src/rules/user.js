/** Returns true if value is a valid email address. */
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

/** Returns true if value is a valid E.164 or common phone format. */
export function isPhone(value) {
  return /^\+?[\d\s\-().]{7,15}$/.test(String(value).trim())
}

/**
 * Returns true if password is at least 8 chars, has uppercase,
 * lowercase, digit and special character.
 */
export function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)
}
