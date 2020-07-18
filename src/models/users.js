import XRegExp from 'xregexp';

import db from '../db'

import * as tokens from './tokens'
import { get_win_rate } from './game';

const default_js_code = [{
  name : 'index.js',
  code : 'robot.walk(2); robot.turn_right()',
  is_entrypoint: true
}]

const default_san_code = [{
  name : 'main.sn',
  code : 'fn main (robot: Robot&) {\n    robot.walk(1);\n}',
  is_entrypoint: true
}]

export const File = db.Schema({
  name: { type: String },
  code: { type: String },
  is_entrypoint: { type: Boolean, default: false }
}, { _id: false })

export const model = db.model('User', {
  username: { type: String, },
  email: { type: String, },
  password: { type: String, },
  groups: [{ type: db.Types.ObjectId, ref: 'Group', }],
  score: { type: Number, default: 0, },
  created: { type: Date, default: Date.now, },
  robot: { type: String, default: 'default' },
  js_code: { type: [File], default: default_js_code },
  san_code: { type: [File], default: default_san_code },
  running_language: { type: String, default: 'js' },
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

export async function sanitize(user) {
  if (!user) return {}

  const win_ratio = await get_win_rate(user._id)

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    groups: user.groups,
    score: user.score,
    registered: user.created,
    robot: user.robot,
    win_ratio,
    running_language: user.running_language,
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

export async function change_points(user_id, points) {
  const user = await model.findById(user_id)

  user.score += points
  user.save()
}