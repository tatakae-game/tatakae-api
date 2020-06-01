import token_middlware from '../socket-middlewares/token'

import * as users from '../models/users'
import * as rooms from '../models/rooms'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/chat').use(token_middlware)

  const namespaces = {}

  nsp.on('connection', async (socket) => {
    const room_id = socket.handshake.query?.room

    if (!room_id) {
      socket.disconnect()
    }

    try {
      const room = await rooms.model.findById({ _id: room_id })
      const user = await users.find_by_token(socket.token)

      if (room._id in namespaces) {
        namespaces[room._id].push(socket.id)
      } else {
        namespaces[room._id] = [socket.id]
      }

      socket.on('disconnect', () => {
        for (const id in namespaces) {
          namespaces[id] = namespaces[id].filter(s => s !== socket.id)
        }
      })

      socket.on('message', message => {
        message.author = user.id;
        message.date = new Date()
        room.messages.push(message)
        room.save()

        for (const id of namespaces[room._id]) {
          nsp.sockets[id].emit('new message', rooms.sanitize_message(message))
        }
      })
    } catch {
      console.error(`The room ${room_id} does not exist.`)
    }
  })
}
