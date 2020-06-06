import * as fs from 'fs'
import * as path from 'path'

import * as game_constants from '../constants/game'
import * as wandbox from './wandbox.service'
import game_classes from '../game/game-classes'
import * as users from '../models/users'

function fill_ground(type, size) {
  return Array(size * size).fill(type)
}

function fill_items(size) {
  return Array(size * size).fill([])
}

function generate_obstacle(size) {
  let obstacle_counter = 0
  const tiles = []
  for (let i = 0; i < size * size; i++) {
    if (obstacle_counter < game_constants.MAX_OBSTACLE && Math.floor(Math.random() * Math.floor(3)) === 2) {
      tiles.push(game_constants.SELECTABLE_OBSTACLE[Math.floor(Math.random() * Math.floor(game_constants.SELECTABLE_OBSTACLE.length))])
      obstacle_counter++
    } else {
      tiles.push(null)
    }
  }
  return tiles
}

function fill_addresses(size) {
  const tiles = []
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      tiles.push({ x: j, y: i })
    }
  }
  return tiles
}

const instantiate_empty_fields = (size, type) => {
  const layers = {}
  for (const field of game_constants.LAYERS) {
    layers[field] = Array(size * size).fill(null)
  }

  layers.ground = fill_ground(type, size)
  layers.obstacles = generate_obstacle(size)
  layers.addresses = fill_addresses(size)
  layers.items = fill_items(size)


  return layers
}

const generate_field = () => {

  const field_type = game_constants.SELECTABLE_TILES[Math.floor(Math.random() * game_constants.SELECTABLE_TILES.length)]
  const field_size = game_constants.SELECTABLE_SIZE[Math.floor(Math.random() * game_constants.SELECTABLE_SIZE.length)]

  return instantiate_empty_fields(field_size, field_type)
}

function sanitize_robot_data(robot) {
  return {
    id: robot.robot_id,
    hp: robot.hp,
    model: robot.model,
    position: robot.position,
    orientation: robot.orientation,
  }
}


function sanitize_game_start(game_configuration) {
  return {
    username: game_configuration.user.username,
    opponent_username: game_configuration.opponent.username,
    map: game_configuration.map,
  }
}

function reupdate_memory_map(robot, action) {
  if (action.tiles_checked) {
    for (const tile_to_update of action.tiles_checked) {
      robot.memory_map[robot.map.get_index_by_address(tile_to_update.addresses.x, tile_to_update.addresses.y)] = tile_to_update
    }
  }
}

function resolve_action(action, robot) {
  const name = action.name

  switch (name) {
    case 'walk':
      robot.position = action.new_position
      reupdate_memory_map(robot, action)
      break

    case 'jump':
      robot.position = action.new_position
      resolve_events(action.events, robot.map)
      reupdate_memory_map(robot, action)
      break

    case 'check':
      reupdate_memory_map(robot, action)
      break

    case 'hit':
      resolve_events(action.events, robot.map)
      break

    case 'get-hit':
      robot.hp -= action.damage
      break

    case 'die':
      robot.status = "dead"
      resolve_events(action.events, robot.map)
      break

    case 'turn-left':
      robot.orientation = action.new_orientation
      break

    case 'turn-right':
      robot.orientation = action.new_orientation
      break

    case 'OOE':
      break

    default:
      break
  }
}

const emit_game_start = (socket, game_configuration) => {
  socket.emit('match found', sanitize_game_start(game_configuration))
}

function resolve_events(events, map) {
  for (const event of events) {
    switch (event.name) {
      case 'bumped':
        break

      case 'destroy':
        map.layers.obstacles[map.get_index_by_address(event.address.x, event.address.y)] = null
        break


      case 'lay-scraps':
        map.layers.items[map.get_index_by_address(event.address.x, event.address.y)].push('scraps')
        break

    }
  }
}

const update_robot = (round, robot, opponent_robot) => {
  for (const action of round.actions) {
    if (action.robot_id === robot.robot_id) {
      resolve_action(action, robot)
    } else {
      resolve_action(action, opponent_robot)
    }

    if (action.name === 'die') {
      return
    }
  }
}



function trim_class_file(class_file_string) {
  const trimmed_string = class_file_string.replace(/export.*/, '')
  return trimmed_string
}

const encapsulate_user_code = async (code, robot, opponent_robot, map) => {
  const final_code_promise = new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, '../game/game-code.js'), (err, data) => {
      if (err) {
        return reject(err)
      } else {
        resolve(data)
      }
    })
  })

  const game_classes_promise = new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, '../game/game-classes.js'), (err, data) => {
      if (err) {
        return reject(err)
      } else {
        resolve(data)
      }
    })
  })

  let final_code = (await final_code_promise).toString()
  let game_classes = (await game_classes_promise).toString()

  final_code = final_code.replace('{{ game_classes }}', trim_class_file(game_classes))
  final_code = final_code.replace('{{ user_robot_string }}', JSON.stringify(robot))
  final_code = final_code.replace('{{ map_string }}', JSON.stringify(map))
  final_code = final_code.replace('{{ opponent_robot_string }}', JSON.stringify(opponent_robot))


  final_code = final_code.replace('{{ user_code }}', code)

  return final_code

}

const run_round = async (robot, user_code, opponent, map, language) => {
  if (language === 'js') {
    const robot_turn_code = await encapsulate_user_code(user_code, robot, opponent, map)
    return await wandbox.execute_code(robot_turn_code)
  } else if (language === 'san') {
    // TODO implement san round_movement get
  }

}

/**
 * 
 * @param {SocketIO.Socket} socket 
 * @param {*} round_movements 
 * @param {*} game_configuration 
 */
const end_round = (socket, round_movements, game_configuration) => {
  update_robot(round_movements, game_configuration.active_robot, game_configuration.opponent_robot)
  if (game_configuration.active_robot.status === 'dead' || game_configuration.opponent_robot.status === 'dead') {
    game_configuration.all_killed = true
    end_game(socket, game_configuration)
  } else {
    socket.emit('round actions', round_movements);

    // switch active robot
    [game_configuration.active_robot, game_configuration.opponent_robot] = [game_configuration.opponent_robot, game_configuration.active_robot]

    // switch running code & running_language
    game_configuration.user_code = game_configuration.user_code === game_configuration.user.code ? game_configuration.opponent.code : game_configuration.user.code
    game_configuration.running_language = game_configuration.running_language === game_configuration.user.running_language ? game_configuration.opponent.running_language : game_configuration.user.running_language
  }
}

const end_game = (socket, game_configuration) => {

  if (game_configuration.test) {
    socket.emit('end test phase')
  } else {
    console.log(game_configuration)
    const { loser, winner } = game_configuration.active_robot.status === 'dead' ?
      { loser: game_configuration.active_robot.robot_id, winner: game_configuration.opponent_robot.robot_id } :
      { loser: game_configuration.opponent_robot.robot_id, winner: game_configuration.active_robot.robot_id }

    console.log('loser :' + loser)
    console.log('winner :' + winner)

  }
}

const generate_test_game_config = async (socket, code, language) => {
  const game_config = {
    user: {
      username: 'tester',
      _id: 'user',
      code,
      robot: 'default'
    }
  }

  game_config.opponent = {
    username: 'opponent',
    _id: 'opponent',
    code,
    robot: 'default'
  }

  game_config.map = new game_classes.Map(generate_field())
  game_config.active_robot = new game_classes.Robot(game_config.user.robot, game_config.map, game_config.user._id)
  game_config.opponent_robot = new game_classes.Robot(game_config.opponent.robot, game_config.map, game_config.opponent._id)

  game_config.user_code = game_config.user.code

  randomize_initial_robot_position(game_config.active_robot, game_config.opponent_robot, game_config.map)

  if (socket.handshake.query.running_language) {
    game_config.user.running_language = socket.running_language
    game_config.opponent.running_language = socket.running_language
  } else {
    game_config.user.running_language = 'js'
    game_config.opponent.running_language = 'js'
  }

  game_config.running_language = game_config.user.running_language
  game_config.all_killed = false
  game_config.test = true

  return game_config
}

const start_game = async (socket) => {
  const game_config = {
    user: await users.find_by_token(socket.token)
  }

  game_config.opponent = await users.find_opponent(game_config.user)
  game_config.map = new game_classes.Map(generate_field())
  game_config.active_robot = new game_classes.Robot(game_config.user.robot, game_config.map, game_config.user._id)
  game_config.opponent_robot = new game_classes.Robot(game_config.opponent.robot, game_config.map, game_config.opponent._id)

  game_config.user_code = game_config.user.code

  randomize_initial_robot_position(game_config.active_robot, game_config.opponent_robot, game_config.map)

  if (socket.running_language) {
    game_config.user.running_language = socket.running_language
  }

  game_config.running_language = game_config.user.running_language

  game_config.all_killed = false

  return game_config

}

function generate_spawn_actions(robot, opponent) {
  return {
    actions: [
      {
        name: 'spawn',
        unit: sanitize_robot_data(robot),
      },
      {
        name: 'spawn',
        unit: sanitize_robot_data(opponent),
      }
    ]
  }
}

const emit_robot_spawn = (socket, game_configuration) => {
  socket.emit('spawn', generate_spawn_actions(game_configuration.active_robot, game_configuration.opponent_robot))
}

const sanitize_round_info = (user_round, opponent_round) => {

}

const get_first_free_tile = (side, map) => {
  let tile_address = {}
  switch (side) {
    case 'up':
      tile_address = { x: 0, y: 0, }
      while (map.has_obstacle(tile_address)) {
        tile_address.x++
        if (tile_address.x >= map.square_size) {
          tile_address.y++
          tile_address.x = 0
        }
      }

      break

    case 'right':

      tile_address = { x: map.square_size - 1, y: 0, }
      while (map.has_obstacle(tile_address)) {
        tile_address.y++
        if (tile_address.y >= map.square_size) {
          tile_address.x--
          tile_address.y = 0
        }
      }
      break

    case 'down':
      tile_address = { x: 0, y: map.square_size - 1, }
      while (map.has_obstacle(tile_address)) {
        tile_address.x++
        if (tile_address.x >= map.square_size) {
          tile_address.y--
          tile_address.x = 0
        }
      }
      break

    case 'left':
      tile_address = { x: 0, y: 0, }
      while (map.has_obstacle(tile_address)) {
        tile_address.y++
        if (tile_address.y > map.square_size) {
          tile_address.x++
          tile_address.y = 0
        }
      }

      break

  }
  return tile_address

}

const randomize_initial_robot_position = (robot, enemy_robot, map) => {
  const robot_side = game_classes.Map.directions[Math.floor(Math.random() * Math.floor(game_classes.Map.directions.length))]
  const opponent_side = game_classes.Map.directions[(game_classes.Map.directions.indexOf(robot_side) + 2) % 4]
  robot.position = get_first_free_tile(robot_side, map)
  robot.orientation = opponent_side
  enemy_robot.position = get_first_free_tile(opponent_side, map)
  enemy_robot.orientation = robot_side
}

export {
  generate_field,
  get_first_free_tile,
  encapsulate_user_code,
  update_robot,
  end_game,
  sanitize_round_info,
  randomize_initial_robot_position,
  start_game,
  run_round,
  end_round,
  emit_game_start,
  emit_robot_spawn,
  generate_test_game_config
}