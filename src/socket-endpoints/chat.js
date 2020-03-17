import token_middlware from '../socket-middlewares/token'
import * as users from '../models/users'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/chat').use(token_middlware)

  nsp.on('connection', async (socket) => {
    const room = socket.handshake.query?.room

    if (!room) {
      socket.disconnect()
    }

    const user = await users.find_by_token(socket.token)
    console.log(user)

    socket.on('message', message => {
      console.log(`New message to room ${room} from ${user.username}`, message)
    })
  })
}
