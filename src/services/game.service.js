import * as fs from 'fs'
import * as path from 'path'

import * as game_constants from '../constants/game'
import * as wandbox from './wandbox.service'
import game_classes from '../game/game-classes'
import * as users from '../models/users'
import * as games_models from '../models/game'
import { JsRunner } from '../game/js-runner'
import { SanRunner } from '../game/san-runner'

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
    players: game_configuration.players,
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

const update_robot = (round, robots) => {
  for (const action of round.actions) {
    const active_robot = robots.filter(robot => robot.robot_id == action.robot_id)[0]
    resolve_action(action, active_robot)


    if (action.name === 'die') {
      return
    }
  }
}

/**
 * 
 * @param {SocketIO.Socket} socket 
 * @param {*} round_movements 
 * @param {*} game_configuration 
 */
const end_round = (socket, actions, game_configuration) => {
  update_robot(actions, game_configuration.runners.map(runner => runner.robot))
  if (game_configuration.runners.filter(runner => runner.robot.status === 'alive').length <= 1) {
    game_configuration.all_killed = true
    end_game(socket, game_configuration)
  } else {
    socket.emit('round actions', actions)
  }
}

const end_game = async (socket, game_configuration) => {

  if (game_configuration.test) {
    socket.emit('end test phase')
  } else {

    const winners = game_configuration.runners.filter(runner => runner.robot.status === 'alive')
    const losers = game_configuration.runners.filter(runner => runner.robot.status === 'dead')

    const winners_id = winners.map(winner => winner.robot.robot_id)
    const losers_id = losers.map(loser => loser.robot.robot_id)

    for (const winner_id of winners_id) {
      await users.change_points(winners_id, 1)
    }

    for (const loser_id of losers_id) {
      await users.change_points(loser_id -1)
    }

    await register_game(game_configuration, winners_id, losers_id)

    emit_end_game(socket, winners, losers_id)

  }
}

function emit_end_game(socket, winners, losers) {
  socket.emit('end game', {
    winners: winners,
    loser: losers,
  })
}

async function register_game(game_conf, winners, losers) {
  const game = await games_models.model.create({
    winners,
    participants: [...winners, ...losers],
    actions: game_conf.actions,
  })
}

const generate_test_game_config = async (socket, files, language) => {
  const game_config = {
    players: [
      {
        username: 'testor',
        _id: 'testor',
        robot: 'default',
        running_language: language
      },
      {
        username: 'opponent',
        _id: 'opponent',
        robot: 'default',
        running_language: language
      }
    ]
  }

  if(language === 'js'){
    game_config.players[0].js_code = files
    game_config.players[1].js_code = files
  } else if (language === 'san') {
    game_config.players[0].san_code = files
    game_config.players[1].san_code = files
  } else {
    game_config.players[0].js_code = files
    game_config.players[1].js_code = files
  }

  game_config.map = new game_classes.Map(generate_field())
  game_config.runners = generate_runners(game_config.players, game_config.map)

  randomize_initial_robot_position(game_config.runners.map(runner => runner.robot), game_config.map)

  game_config.all_killed = false
  game_config.test = true

  return game_config
}

async function get_players(token, map) {
  const requesting_user = await users.find_by_token(token)
  const opponent = await users.find_opponent(requesting_user)

  return [requesting_user, opponent]
}

function generate_runners(players, map) {
  const runners_queue = []

  for (const player of players) {
    if (player.running_language === 'js') {
      runners_queue.push(new JsRunner(player, map))
    } else if (player.running_language === 'san') {
      runners_queue.push(new SanRunner())
    }
  }
  return runners_queue
}

const start_game = async (socket) => {

  const game_config = {
    players: await get_players(socket.token),
  }
  game_config.map = new game_classes.Map(generate_field())
  game_config.runners = generate_runners(game_config.players, game_config.map)

  randomize_initial_robot_position(game_config.runners.map(runners => runners.robot), game_config.map)

  game_config.all_killed = false

  return game_config

}

function generate_spawn_actions(robots) {
  return {
    actions: robots.map(
      robot => ({
        name: 'spawn',
        unit: sanitize_robot_data(robot)
      })
    )
  }
}

const emit_robot_spawn = (socket, game_configuration) => {
  socket.emit('spawn', generate_spawn_actions(game_configuration.runners.map(runner => runner.robot)))
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

const randomize_initial_robot_position = (robots, map) => {
  const robot_side = game_classes.Map.directions[Math.floor(Math.random() * Math.floor(game_classes.Map.directions.length))]
  const opponent_side = game_classes.Map.directions[(game_classes.Map.directions.indexOf(robot_side) + 2) % 4]
  robots[0].position = get_first_free_tile(robot_side, map)
  robots[0].orientation = opponent_side
  robots[1].position = get_first_free_tile(opponent_side, map)
  robots[1].orientation = robot_side
}

export {
  generate_field,
  get_first_free_tile,
  update_robot,
  end_game,
  randomize_initial_robot_position,
  start_game,
  end_round,
  emit_game_start,
  emit_robot_spawn,
  generate_test_game_config
}