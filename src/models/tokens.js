import crypto from 'crypto'

import db from '../db'

export const model = db.model('Token', {
  value: { type: String, },
  user: { type: db.Types.ObjectId },
  expires: { type: Date, },
})

export const length = 32 // Must be a pair

export const expiry_duration = 6.048e+8 // 6.048e+8 = 1 week in milliseconds

export async function check(token) {
  if (!token) return false
  if ((typeof token) !== 'string') return false
  if (length !== token.length) return false

  return await model.exists({
    value: token,
    expires: { $gt: Date.now(), }
  })
}

/**
 * @param {db.Types.ObjectId} user 
 * @param {boolean} never_expires 
 */
export function create(user, never_expires = false) {
  const token = crypto.randomBytes(length / 2).toString('hex')

  const expires = never_expires ? new Date(8640000000000000) : (Date.now() + expiry_duration)

  return model.create({
    value: token,
    user,
    expires,
  })
}
