import db from '../db'

export const Message = new db.Schema({
  author: { type: db.Types.ObjectId, },
  type: { type: String, },
  data: { type: String, },
  date: { type: Date, default: Date.now, }
})

export const model = db.model('Room', {
  status: { type: String, default: 'opened' },
  author: { type: db.Types.ObjectId, },
  name: { type: String, },
  messages: { type: [Message], default: [], },
  users: { type: [db.Types.ObjectId], default: [], },
  created: { type: Date, default: Date.now, },
  is_ticket: { type: Boolean, default: false, },
  assigned_to: { type: db.Types.ObjectId, },
})

export function sanitize_message(message) {
  if (!message) return {}

  return {
    id: message._id,
    author: message.author,
    type: message.type,
    data: message.data,
    date: message.date,
  }
}

export function sanitize(room) {
  if (!room) return {}

  return {
    id: room._id,
    author: room.author,
    name: room.name,
    messages: (room.messages || []).map(sanitize_message),
    users: (room.users || []),
    created: room.created,
    is_ticket: room.is_ticket,
    assigned_to: room.assigned_to,
  }
}
