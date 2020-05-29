{{ game_classes }}

const robot = Robot.from_instance(JSON.parse('{{ user_robot_string }}'), {square_size: 2})
const opponent = Robot.from_instance(JSON.parse('{{ opponent_robot_string }}'), {square_size: 2})
const map = Map.from_instance(JSON.parse('{{ map_string }}'), robot, [opponent])

robot.map = map
opponent.map = map

while (robot.battery > 0 && opponent.hp > 0 && robot.isRunning) {
  {{ user_code }}
}

console.log(JSON.stringify(robot.round_movements))
