// ── @bezon/validation barrel export ──────────────────────────────────────────
// Isomorphic – safe to import in both browser (React apps) and Node (API).
// Usage:  import { isEmail, isPhone } from '@bezon/validation'

export { isEmail, isPhone, isStrongPassword } from './rules/user.js'
export { isValidPrice, isValidQuantity, isValidSlug } from './rules/product.js'
export { isValidOrderStatus } from './rules/order.js'
export { required, minLength, maxLength, composeValidators } from './utils.js'
