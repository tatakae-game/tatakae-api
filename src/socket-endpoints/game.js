import token_middlware from '../socket-middlewares/token'
import * as users from '../models/users'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/matchmaking').use(token_middlware)

  nsp.on('connection', async (socket) => {
    try {

      const user = await users.find_by_token(socket.token)
      const closest_high_opponents = await users.model.find({
        score: {
          $gte: user.score,
        },
        _id: {
          $ne: user._id,
        },
      }).sort({ score: 1 })
        .limit(5)
        .lean()

      const closest_low_opponents = await users.model.find({
        score: {
          $lte: user.score,
        },
        _id: {
          $ne: user._id,
        },
      }).sort({ score: -1 })
        .limit(5)
        .lean()

      const opponents = closest_high_opponents.concat(closest_low_opponents)

      console.log(opponents)
    } catch (e) {
      console.log(e)
    }
  })
}



