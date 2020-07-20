import atob from 'atob'

import token_middlware from '../socket-middlewares/token'
import * as game_service from '../services/game.service'
import * as game_constants from '../constants/game'
import { check_include_errors } from '../services/code.service'

/**
 * @param {import('socket.io').Server} io 
 */
export default (io) => {
  const nsp = io.of('/matchmaking').use(token_middlware)
  nsp.on('connection', async (socket) => {

    try {
      let game_configuration
      if (socket.handshake.query.test === 'true') {
        const files = JSON.parse(atob(socket.handshake.query.code))

        if (socket.handshake.query.language === 'js') {
          const include_errors = check_include_errors(files)
          if (include_errors.length !== 0) {

            return socket.emit('err', {
              error: include_errors
            })
          }
        }

        game_configuration = await game_service.generate_test_game_config(socket, files, socket.handshake.query.language)
        const errors = await game_configuration.runners[0].test()
        if (errors) {
          return socket.emit('err', {
            error: errors
          })
        }

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
      await game_service.end_game(socket, game_configuration)

      socket.disconnect(true)

    } catch (e) {
      console.log(e)
    }
  })
}



