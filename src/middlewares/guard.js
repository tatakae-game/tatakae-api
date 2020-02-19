import * as constants from '../constants'
import * as auth from '../auth'

const default_options = {
  auth: constants.AUTH,
}

/**
 * @returns {import('express').RequestHandler}
 */
export default (options = default_options) => async (req, res, next) => {
  const token = req.token
  const connected = await auth.check(token)

  const need_auth = options.auth === constants.AUTH

  if (need_auth !== connected) {
    return next('route')
  }

  next()
}
