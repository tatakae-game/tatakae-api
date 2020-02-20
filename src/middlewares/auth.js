import * as tokens from '../models/tokens'

/**
 * @type {import('express').RequestHandler} 
 */
export default async (req, res, next) => {
  req.authed = await tokens.check(req.token)

  next()
}
