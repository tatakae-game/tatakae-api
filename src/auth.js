import { ErrorsGenerator } from './utils/errors'

import * as tokens from './models/tokens'

/**
 * @param {string} token 
 */
export function check(token) {
  return tokens.check(token)
}

export function invalid_token() {
  return ErrorsGenerator.gen(['Invalid token.'])
}
