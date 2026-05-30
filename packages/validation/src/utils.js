/**
 * Validator that ensures a value is non-empty.
 * Returns an error message string or undefined.
 * @param {string} [message]
 * @returns {(value: unknown) => string | undefined}
 */
export function required(message = 'This field is required') {
  return (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return message
    }
  }
}

/**
 * Validator that enforces a minimum string length.
 * @param {number} min
 * @param {string} [message]
 */
export function minLength(min, message) {
  return (value) => {
    if (String(value).length < min) {
      return message ?? `Must be at least ${min} characters`
    }
  }
}

/**
 * Validator that enforces a maximum string length.
 * @param {number} max
 * @param {string} [message]
 */
export function maxLength(max, message) {
  return (value) => {
    if (String(value).length > max) {
      return message ?? `Must be at most ${max} characters`
    }
  }
}

/**
 * Compose multiple validators – returns the first error encountered.
 * @param {...(value: unknown) => string | undefined} validators
 * @returns {(value: unknown) => string | undefined}
 */
export function composeValidators(...validators) {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
  }
}
