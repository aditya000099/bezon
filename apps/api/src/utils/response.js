/**
 * Centralised error response helper
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [details]
 */
export function sendError(res, statusCode, message, details) {
  return res.status(statusCode).json({ message, ...(details && { details }) })
}

/**
 * Centralised success response helper
 * @param {import('express').Response} res
 * @param {object} data
 * @param {number} [statusCode]
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data })
}
