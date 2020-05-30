import * as fs from 'fs'
import * as path from 'path'

import token_middlware from '../socket-middlewares/token'
import * as users from '../models/users'
import * as wandbox from '../services/wandbox.service'
import * as game_service from '../services/game.service'
import gameClasses from '../game/game-classes'
import * as game_constants from '../constants/game'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/matchmaking').use(token_middlware)

  nsp.on('connection', async (socket) => {
    try {

      /**
       *  data for front instanciation
       */

       const game_configuration = game_service.start_game(socket)
      


      socket.emit('match found', await game_service.sanitize_game_info(user, robot, opponent, opponent_robot, field))
      game_service.emit_robot_spawn()

      // fs.readFile(path.resolve(__dirname, "./game-classes.js"), async (err, game_classes) => {
      //   if (err) {
      //     console.log(err)
      //   } else {
      //     const trimmed_classes = game_classes.toString().replace(/export.*/, '')
      //     let actual_turn = 0

      //     while (robot.hp > 0 && opponent_robot.hp > 0 && actual_turn < game_constants.END_TURN) {
      //       game_service.resetRobots(robot, opponent_robot)

      //       const user_round = await wandbox.execute_code(trimmed_classes + game_service.encapsulate_user_code(user.code, robot, opponent_robot))
      //       game_service.update_robot(user_round, robot, opponent_robot)

      //       const opponent_round = await wandbox.execute_code(trimmed_classes + game_service.encapsulate_user_code(opponent.code, opponent_robot))
      //       game_service.update_robot(opponent_round, opponent_robot, robot)

      //       actual_turn++
      //       socket.emit('round_evenements', await game_service.sanitize_round_info(user_round, opponent_round))
      //       console.log(user_round[0])
      //     }

      //     game_service.end_game(socket, robot, opponent_robot, user, opponent)
      //   }
      // })

    } catch (e) {
      console.log(e)
    }
  })
}



