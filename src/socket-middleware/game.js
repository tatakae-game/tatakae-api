import token_middlware from '../socket-middlewares/token'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  io.use(token_middlware).on('connection', socket => {
    socket.on('matchmaking', (data) => {
      console.log('game on')
    })
  })
}
