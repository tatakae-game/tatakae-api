{{ game_classes }}

const robot = Robot.from_instance(JSON.parse('{{ user_robot_string }}'), {square_size: 2})
const opponent = Robot.from_instance(JSON.parse('{{ opponent_robot_string }}'), {square_size: 2})
const map = Map.from_instance(JSON.parse('{{ map_string }}'), robot, [opponent])

robot.map = map
opponent.map = map

const last_turn_energy = robot.energy

while (robot.battery > 0 && opponent.hp > 0 && robot.is_running) {
  {{ user_code }}

  if(robot.energy === robot.last_turn_energy) { 
    robot.is_running = false
  }
}

robot.map = null
opponent.map = null

console.log(JSON.stringify(robot.round_movements))
