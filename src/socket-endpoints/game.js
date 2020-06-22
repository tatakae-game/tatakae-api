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
      let game_configuration
      if (socket.handshake.query.test === 'true') {
        game_configuration = await game_service.generate_test_game_config(socket, socket.handshake.query.code, socket.handshake.query.language)
      } else {
        game_configuration = await game_service.start_game(socket)
      }

      game_service.emit_game_start(socket, game_configuration)
      game_service.emit_robot_spawn(socket, game_configuration)
      let turn = game_constants.END_TURN
      const game_actions = []

      // each turn is affected to robot, meaning turn should be X 2
      while (turn > 0 && !game_configuration.all_killed) {
        const round_runner = game_configuration.runners.shift()
        const round_actions = await round_runner.run(game_configuration.runners.map(runner => runner.robot))
        game_configuration.runners.push(round_runner)
        game_service.end_round(socket, round_actions, game_configuration)
        game_actions.push(...round_actions.actions)
        turn -= 1
      }

      game_configuration.actions = game_actions
      game_service.end_game(socket, game_configuration)

      socket.disconnect(true)

    } catch (e) {
      console.log(e)
    }
  })
}



