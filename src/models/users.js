import XRegExp from 'xregexp';

import db from '../db'

import * as tokens from './tokens'

export const model = db.model('User', {
  username: { type: String, },
  email: { type: String, },
  password: { type: String, },
  groups: [{ type: db.Types.ObjectId, ref: 'Group', }],
  score: { type: Number, default: 0, },
  created: { type: Date, default: Date.now, },
  robot: { type: String, default: 'default' },
  code: {type : String, default: ''}
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

  return await model.findById(user).populate('groups')
}

export function sanitize(user) {
  if (!user) return {}

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    score: user.score,
    registred: user.created,
    robot: user.robot,
  }
}

export async function find_opponent(user) {
  const closest_high_opponents = await model.find({
    score: {
      $gte: user.score,
    },
    _id: {
      $ne: user._id,
    },
  }).sort({ score: 1 })
    .limit(5)
    .lean()

  const closest_low_opponents = await model.find({
    score: {
      $lte: user.score,
    },
    _id: {
      $ne: user._id,
    },
  }).sort({ score: -1 })
    .limit(5)
    .lean()

  const opponents = closest_high_opponents.concat(closest_low_opponents)
  const random_index = Math.floor(Math.random() * Math.floor(opponents.length))
  return opponents[random_index]
}
