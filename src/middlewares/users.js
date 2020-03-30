import * as users from '../models/users'

/**
 * @type {import('express').RequestHandler} 
 */
export default async (req, res, next) => {

  req.user = await users.find_by_token(req.token)

  next()
}