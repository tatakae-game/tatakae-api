import token_middlware from '../socket-middlewares/token'
import * as users from '../models/users'
import * as wandbox from '../services/wandbox.service'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/matchmaking').use(token_middlware)

  nsp.on('connection', async (socket) => {
    try {

      const user = await users.find_by_token(socket.token)
      const opponent = await users.find_opponent(user)



      socket.emit('match found', {
        opponent_robot: opponent.robot,
        robot: user.robot,
      })


      console.log(opponent)

      wandbox.execute_code('console.log("chat")', {chat: 'chat'})
    } catch (e) {
      console.log(e)
    }
  })
}



