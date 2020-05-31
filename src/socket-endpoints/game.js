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

      const game_configuration = await game_service.start_game(socket)

      game_service.emit_game_start(socket, game_configuration)
      game_service.emit_robot_spawn(socket, game_configuration)
      let turn = game_constants.END_TURN

      while (turn > 0 && !game_configuration.all_killed) {
        const round_actions = await game_service.run_round(game_configuration.active_robot, game_configuration.user_code, game_configuration.opponent_robot, game_configuration.map, game_configuration.running_language)
        console.log(round_actions)
        game_service.end_round(socket, round_actions, game_configuration)
      }

      game_service.end_game(socket, game_configuration)

    } catch (e) {
      console.log(e)
    }
  })
}



