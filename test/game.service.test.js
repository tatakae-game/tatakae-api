import { strict as assert } from 'assert'
import * as lodash from 'lodash'
import * as game_constants from '../src/constants/game'
import * as game_service from '../src/services/game.service'
import game_classes from '../src/game/game-classes'

const user_ids = ['1203ascasc123', '1203ascasc153', '1203ascasc193', '1203ascasc1123']

function compare_memory_maps(robot, copy) {

  for (let i = 0; i < robot.memory_map.length; i++) {
    if (robot.memory_map[i] === 'not_discovered') {
      assert.equal(robot.memory_map[i], copy.memory_map[i])
    } else {
      for (const layer in robot.memory_map[i])
        assert.equal(robot.memory_map[i].layer, copy.memory_map[i].layer)
    }
  }
}

function generate_game_config() {

  const game_config = {
    user: {
      code: 'walk(3)',
      selected_language: 'js',
    },
    opponent: {
      code: 'jump()',
      selected_language: 'js',
    }
  }
  game_config.user_code = game_config.user.code
  game_config.map = new game_classes.Map(game_service.generate_field())
  game_config.active_robot = new game_classes.Robot('default', game_config.map, user_ids[0])
  game_config.opponent_robot = new game_classes.Robot('default', game_config.map, user_ids[1])

  game_service.randomize_initial_robot_position(game_config.active_robot, game_config.opponent_robot, game_config.map)

  game_config.selected_language = 'js'

  return game_config

}


describe('generate_field()', () => {
  it('should return a map of x layers, depending of constants', () => {
    const field = game_service.generate_field()
    assert.equal(Object.keys(field).length, game_constants.LAYERS.length)
  })
})

describe('update_robot()', () => {
  describe('walk', () => {
    it('should properly place robot on walk action', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[0])

      const robot_copy = game_classes.Robot.from_instance(robot, map)

      robot_copy.walk(3)
      robot_copy.battery = robot.battery

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.position.x, robot_copy.position.x)
      assert.equal(robot.position.y, robot_copy.position.y)

    })

    it('should properly update robot memory on tile crossed or bumped on', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[0])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      robot_copy.walk(3)

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      compare_memory_maps(robot, robot_copy)
    })
  })

  describe('check', () => {
    it('should properly update robot memory map', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[0])
      opponent.position = { x: 0, y: 1 }
      map.set_enemy_robots([opponent])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])


      robot_copy.check()

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      compare_memory_maps(robot, robot_copy)
    })
  })

  describe('die', () => {
    it('should turn dead robot status to death', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      opponent.position = { x: 0, y: 1 }
      opponent.hp = 1

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])

      opponent_copy.position = { x: 0, y: 1 }
      opponent_copy.hp = 1

      map.set_enemy_robots([opponent_copy])

      robot_copy.hit()

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(opponent.status, "dead")
    })

    it('should stop process on death revealed to earn process time', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      opponent.position = { x: 0, y: 1 }
      opponent.hp = 1

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])

      opponent_copy.position = { x: 0, y: 1 }
      opponent_copy.hp = 1

      map.set_enemy_robots([opponent_copy])

      robot_copy.hit()
      robot_copy.clockwise_rotation()

      assert.equal(robot_copy.orientation, 'right')

      assert.equal(robot.orientation, 'up')

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(opponent.status, 'dead')
      assert.equal(robot.orientation, 'up')
    })

    it('should lay scraps on map', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      opponent.position = { x: 0, y: 1 }
      opponent.hp = 1

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])

      opponent_copy.position = { x: 0, y: 1 }
      opponent_copy.hp = 1

      map.set_enemy_robots([opponent_copy])

      robot_copy.hit()

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(map.layers.items[map.get_index_by_address(opponent.position.x, opponent.position.y)][0], 'scraps')
    })
  })

  describe('hit', () => {
    it('should only return hit action and not change any status', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])

      map.set_enemy_robots([opponent_copy])

      robot_copy.hit()

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.hp, robot_copy.hp)
    })

    it('should update map on destroyed buildings', () => {
      // Create field and field copy
      const field = game_service.generate_field()
      const field_copy = lodash.cloneDeep(field)

      // create map and map copy
      const map = new game_classes.Map(field)
      const map2 = new game_classes.Map(field_copy)

      // display obstacle on both maps
      map.layers.obstacles[map.get_index_by_address(0, 1)] = 'mountain'
      map2.layers.obstacles[map.get_index_by_address(0, 1)] = 'mountain'

      // Affect copy map to instance
      const robot = new game_classes.Robot('default', map2, user_ids[0])
      const opponent = new game_classes.Robot('default', map2, user_ids[1])

      // affect map to active robot
      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      // Check if setup is right
      assert.equal(map2.has_obstacle({ x: 0, y: 1 }), true)
      assert.equal(map.has_obstacle({ x: 0, y: 1 }), true)

      robot_copy.hit()

      // Check result of action -- 
      assert.equal(map2.has_obstacle({ x: 0, y: 1 }), true)
      assert.equal(map.has_obstacle({ x: 0, y: 1 }), false)

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(map2.has_obstacle({ x: 0, y: 1 }), false)
    })

    it('should trigger get-hit on robot in range', () => {
      const field = game_service.generate_field()

      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])
      opponent.position = { x: 0, y: 1 }

      map.set_enemy_robots([opponent])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      robot_copy.hit()

      assert.equal(robot_copy.round_movements.actions[1].name, 'get-hit')
      assert.equal(robot_copy.round_movements.actions[1].robot_id, opponent.robot_id)

    })
  })

  describe('get-hit', () => {
    it('should update hitted robot hp', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])
      opponent.position = { x: 0, y: 1 }


      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])
      opponent_copy.position = { x: 0, y: 1 }

      map.set_enemy_robots([opponent_copy])

      robot_copy.hit()

      assert.equal(opponent.hp, game_classes.Robot.models[opponent.model].hp)
      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot_copy.round_movements.actions[1].name, 'get-hit')
      assert.equal(robot_copy.round_movements.actions[1].robot_id, opponent.robot_id)
      assert.equal(opponent.hp, game_classes.Robot.models[opponent.model].hp - game_classes.Robot.models[robot_copy.model].damage)
    })
  })

  describe('jump', () => {
    it('should properly display robot on the tile, whatever he bumps or not', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      robot_copy.jump()

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)

      assert.equal(robot_copy.position.x, 0)
      assert.equal(robot_copy.position.y, 2)

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 2)
    })

    it('should update enemy robot hp on bumping on enemy', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])
      opponent.position = { x: 0, y: 2 }


      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      const opponent_copy = new game_classes.Robot('default', map, user_ids[1])
      opponent_copy.position = { x: 0, y: 2 }

      map.set_enemy_robots([opponent_copy])

      robot_copy.jump()

      assert.equal(opponent.hp, game_classes.Robot.models[opponent.model].hp)
      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot_copy.round_movements.actions[1].name, 'get-hit')
      assert.equal(robot_copy.round_movements.actions[1].robot_id, opponent.robot_id)
      assert.equal(opponent.hp, game_classes.Robot.models[opponent.model].hp - 15)
    })
  })

  describe('turn-left', () => {
    it('should change robot orientation on left', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      robot_copy.reverse_clockwise_rotation()

      assert.equal(robot_copy.orientation, 'left')
      assert.equal(robot.orientation, 'up')

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.orientation, robot_copy.orientation)
    })
  })

  describe('turn-right', () => {
    it('should change robot orientation on right', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])

      robot_copy.clockwise_rotation()

      assert.equal(robot_copy.orientation, 'right')
      assert.equal(robot.orientation, 'up')

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.orientation, robot_copy.orientation)
    })
  })

  describe('OOE', () => {
    it('should not interract with robot end turn update at all', () => {
      const field = game_service.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[1])

      const robot_copy = new game_classes.Robot('default', map, user_ids[0])
      robot_copy.battery = 0

      robot_copy.clockwise_rotation()

      game_service.update_robot(robot_copy.round_movements, robot, opponent)

      assert.equal(robot.orientation, robot_copy.orientation)
    })
  })
})


describe('end_game', () => {
  it.skip('should update users score', () => {

  })
})

describe('encapsulate_user_code', () => {
  it.skip('should properly encapsulate user code', () => {
    game_service.encapsulate_user_code('hello world !', new game_classes.Robot('default', { square_size: 2 }, user_ids[0]), new game_classes.Robot('default', { square_size: 2 }, user_ids[1]))
  })
})

describe('run_round', () => {
  it.skip('should return robot turn actions if user_code is usable', async () => {
    const field = game_service.generate_field()
    const map = new game_classes.Map(field)
    map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const opponent = new game_classes.Robot('default', map, user_ids[1])

    const code = "robot.reverse_clockwise_rotation(); robot.jump();"

    const round_actions = await game_service.run_round(robot, code, opponent, map, 'js')
    console.log(round_actions)

  })
})

describe('start_game', () => {
  it.skip('should return full configuration for game instantiation', async () => {
    const game_config = await game_service.start_game({})

  })
})

describe('end_round()', () => {
  it('should switch robot and opponent_robot', () => {
    const game_config = generate_game_config()

    const first_active_robot = game_config.active_robot
    const first_opponent_robot = game_config.opponent_robot

    game_service.end_round({}, game_config.active_robot.round_movements, game_config)

    assert.equal(game_config.active_robot.robot_id, first_opponent_robot.robot_id)
    assert.equal(game_config.opponent_robot.robot_id, first_active_robot.robot_id)
  })

  it('should switch user_code if both are js users', () => {
    const game_config = generate_game_config()

    const first_user_code = game_config.user.code
    const first_opponent_code = game_config.opponent.code
    game_service.end_round({}, game_config.active_robot.round_movements, game_config)

    assert.equal(game_config.user_code, first_opponent_code)
  })

  it('should switch selected_language', () => {
    const game_config = generate_game_config()
    game_config.opponent.selected_language = 'san'

    assert.equal(game_config.selected_language, 'js')
    game_service.end_round({}, game_config.active_robot.round_movements, game_config)

    assert.equal(game_config.selected_language, 'san')
  })
})

describe('get_first_free_tile()', () => {
  it('should return first free tile depending of the passed side', () => {
    const map = new game_classes.Map(game_service.generate_field())
    map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
    const side = 'down'

    const result = game_service.get_first_free_tile(side, map)
    assert.equal(result.x, 0)
    assert.equal(result.y, 0)
  })


  it('should moove initial position if obstacle in on tile', () => {
    const map = new game_classes.Map(game_service.generate_field())
    map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
    map.layers.obstacles[0] = 'mountain'

    const side = 'up'
    const result = game_service.get_first_free_tile(side, map)
    assert.equal(result.x, 1)
    assert.equal(result.y, map.square_size - 1)
  })

  it('should go on second line if first line is full of obstacles', () => {
    const map = new game_classes.Map(game_service.generate_field())
    map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
    for (let i = 0; i < map.square_size; i++) {
      map.layers.obstacles[i] = 'mountain'
    }

    const side = 'up'
    const result = game_service.get_first_free_tile(side, map)
    assert.equal(result.x, 0)
    assert.equal(result.y, map.square_size - 2)
  })
})
