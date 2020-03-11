/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  io.on('connection', socket => {
    socket.on('matchmaking', (data) => {
      console.log('game on')
    })
  })
}
