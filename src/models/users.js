import XRegExp from 'xregexp';

import db from '../db'

import * as tokens from './tokens'

export const model = db.model('User', {
  username: { type: String, },
  email: { type: String, },
  password: { type: String, },
  score: { type: Number, default: 0, },
  created: { type: Date, default: Date.now, },
})

export const username_regex = XRegExp('^[\\p{L}0-9_]{5,20}$');

export const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const password_regex = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/

/**
 * @param {string} token 
 */
export async function find_by_token(token) {
  const { user } = await tokens.model.findOne({
    value: token,
    expires: { $gt: Date.now(), }
  })

  return await model.findById(user)
}

export function sanitize(user) {
  if (!user) return {}

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    score: user.score,
    registred: user.created,
  }
}
