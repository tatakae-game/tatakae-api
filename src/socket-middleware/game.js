/**
 * @param {import('socket.io').Socket} socket 
 */
export default (socket) => {
  socket.on('matchmaking', (data) => {
    console.log('game on')
  })
}
