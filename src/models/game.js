import db from '../db'



/**
 * Action related model
 */

export const Address = new db.Schema({
  x: { type: Number },
  y: { type: Number },
}, { _id: false })

/**
 * Event model
 */
export const Event = new db.Schema({
  name: { type: String },
  address: { type: Address, default: null },
  obstacle: { type: String, default: null },
}, { _id: false })

export const Tile = new db.Schema({
  ground: { type: String },
  obstacle: { type: String },
  addresses: { type: Address },
  items: [{ type: String }],
}, { _id: false })

export const Action = new db.Schema({
  name: { type: String },
  new_position: { type: Address, default: null },
  new_orientation: { type: String, default: null },
  robot_id: { type: String },
  events: [{ type: Event, default: null }],
  tiles_checked: [{ type: Tile }],
  damage: { type: Number, default: null }
}, { _id: false })

export const model = db.model('Game', {
  winner: { type: String },
  participants: [{ type: String }],
  actions: [{ type: Action, default: null }],
  created: { type: Date, default: Date.now, },
})