import * as constants from '../constants'
import { ErrorsGenerator } from '../utils/errors'

const default_options = {
  auth: constants.AUTH,
}

/**
 * @returns {import('express').RequestHandler}
 */
export default (options = default_options) => {
  options = {
    ...default_options,
    ...(options || {}),
  }

  const need_auth = options.auth === constants.AUTH

  return (req, res, next) => {
    if (need_auth !== req.authed) {
      if (req.authed) {
        return res.status(403).send(ErrorsGenerator.gen(['Forbidden']))
      } else {
        return res.status(401).send(ErrorsGenerator.gen(['Unauthorized']))
      }
    }

    next()
  }
}
