import * as tokens from '../models/tokens'

/**
 * @param {import('socket.io').Socket} socket 
 * @param {(err?: any) => void} next 
 */
export default async (socket, next) => {
  socket.token = socket.handshake.headers?.authorization || socket.handshake.query?.token
  console.log(socket.token)

  if (await tokens.check(socket.token)) {
    next()
  } else {
    next(new Error('Authentication needed.'))
  }
}
