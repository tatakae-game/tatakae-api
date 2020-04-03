import * as users from '../models/users'

/**
 * @type {import('express').RequestHandler} 
 */
export default async (req, res, next) => {
  try {
    req.user = await users.find_by_token(req.token)
  } catch {}

  next()
}
