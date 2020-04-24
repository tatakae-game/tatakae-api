import * as game_constants from '../constants/field'

function fill_ground(type, size) {
  return Array(size * size).fill(type)
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
  for (let i = size - 1; i >= 0; i--) {
    for (let j = 0; j < size; j++) {
      tiles.push({ x: i, y: j })
    }
  }
  return tiles
}

const generate_field = () => {
  const field_type = game_constants.SELECTABLE_TILES[Math.floor(Math.random() * Math.floor(game_constants.SELECTABLE_TILES.length))]
  const field_size = game_constants.SELECTABLE_SIZE[Math.floor(Math.random() * Math.floor(game_constants.SELECTABLE_SIZE.length))]

  return [{
    tiles: fill_ground(field_type, field_size)
  },
  {
    tiles: generate_obstacle(field_size)
  },
  {
    tiles: fill_addresses(field_size)
  }
  ]

}


const sanitize_game_info = (user, robot, opponent, opponent_robot, field) => {
  return {
    opponent: {
      name: opponent ? opponent.username : 'dummy',
      robot: {
        hp: opponent_robot.hp,
        modele: opponent_robot.modele,
        battery: opponent_robot.battery,
      },
    },
    player: {
      name: user.username,
      robot: {
        hp: robot.hp,
        modele: robot.modele,
        battery: robot.battery
      },
    },
    field,
  }
}


const encapsulate_user_code = (code, robot, opponent_robot) => {

  const user_robot_string = JSON.stringify(robot)
  const opponent_robot_tring = JSON.stringify(opponent_robot)
  const robot_affectation = `const robot = Robot.from_instance(JSON.parse('${user_robot_string}'));`
  const opponent_robot_affectation = `const enemy_robot = Robot.from_instance(JSON.parse('${opponent_robot_tring}'));`
  const code_starter = `while (robot.battery > 0 && robot.hp > 0 && robot.isRunning) {\n`
  const code_ender = `\n}`
  const returner = `if(robot.onTest) {
    console.log(JSON.stringify(robot.class_tests));
  } else {
    console.log(JSON.stringify(robot.round_movements));
  }`

  return robot_affectation + opponent_robot_affectation + code_starter + code + code_ender + returner

}

const update_robot = (round, robot, opponent_robot) => {

}

const end_game = (socket, robot, opponent_robot, user, opponent) => {

}

const sanitize_round_info = (user_round, opponent_round) => {

}

const resetRobots = (robot, opponent_robot) => {
  robot.battery = robot.models[robot.model].battery
  opponent_robot = opponent_robot.models[opponent_robot.model].battery
}



export {
  generate_field,
  sanitize_game_info,
  encapsulate_user_code,
  update_robot,
  end_game,
  sanitize_round_info,
  resetRobots,
}