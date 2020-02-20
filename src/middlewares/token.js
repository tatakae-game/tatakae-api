/**
 * @type {import('express').RequestHandler} 
 */
export default (req, res, next) => {
  req.token = req.headers?.authorization || req.cookies?.token || req.body?.token || req.query?.token

  next()
}
