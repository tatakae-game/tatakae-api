import * as auth from '../auth'

/**
 * @type {import('express').RequestHandler} 
 */
export default async (req, res, next) => {
  req.authed = await auth.check(req.token)

  next()
}
