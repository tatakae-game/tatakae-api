import argon2 from 'argon2'

export const argon2_config = {
  type: argon2.argon2id,
}

/**
 * @param {string} plain 
 */
export function hash(plain) {
  return argon2.hash(plain, argon2_config)
}

/**
 * @param {string} hash 
 * @param {string} plain 
 */
export function verify(hash, plain) {
  return argon2.verify(hash, plain, argon2_config)
}
