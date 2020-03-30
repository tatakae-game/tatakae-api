import db from '../db'

export const Permission = new db.Schema({
  name: { type: String, },
  value: { type: Boolean, },
})

export const model = db.model('Group', {
  name: { type: String, },
  permissions: { type: [Permission], default: [], },
})
