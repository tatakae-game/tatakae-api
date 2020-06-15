import { strict as assert, AssertionError } from 'assert'

import game_classes from '../src/game/game-classes'
import * as game_services from '../src/services/game.service'


const user_ids = ['1203ascasc123', '1203ascasc153', '1203ascasc193', '1203ascasc1123']
const default_costs = game_classes.Robot.models.default.moove_costs

describe('robot', () => {

  describe('initialization', () => {

    describe('model', () => {
      it('should initialize robot depending of passed model', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('default', map, user_ids[0])

        assert.equal(robot.hp, game_classes.Robot.models[robot.model].hp)
        assert.equal(robot.model, 'default')
      })

      it('should initialize robot as default if model doesnt exist', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('cat', map, user_ids[0])

        assert.equal(robot.model, 'default')
        assert.equal(robot.hp, game_classes.Robot.models[robot.model].hp)
      })

      it('should initialize robot memory map filled with undiscovered tiles', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('default', map, user_ids[0])

        for (const undiscovered_map of robot.memory_map) {
          assert.equal(undiscovered_map, 'not_discovered')
        }
      })
    })

    describe("from_instance()", () => {
      it("should return exact copy of passed robot", () => {
        const field = game_services.generate_field()
        const map = new game_classes.Map(field)
        const robot = new game_classes.Robot('default', map, user_ids[0])
        const copy = game_classes.Robot.from_instance(robot, map)

        for (const properties in robot) {
          assert.equal(robot[properties], copy[properties])
        }
      })
    })
  })

  describe('actions', () => {
    it.skip('should update robot action lists on any actions', () => {

    })

    it.skip('should update robot actions on action errors', () => {

    })
  })


  describe('walk(distance)', () => {
    it('should not allow movement on battery < 2', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.battery = 0
      robot.position = { x: 0, y: 0 }
      robot.walk(1)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)

    })

    it('should remove 2 * n-distance battery for every movement', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const steps = 3
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.position = { x: 0, y: 0 }
      robot.walk(steps)

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - (steps * default_costs.WALK))
    })

    it('should move robot n-distance tiles in front of him', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.battery = 6
      robot.position = { x: 0, y: 0 }
      robot.orientation = 'down'
      robot.walk(3)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 3)
    })

    it('should stop before obstacle and report collision', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill('ruins')

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.battery = 6
      robot.position = { x: 0, y: 0 }
      robot.walk(1)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)
      assert.equal(robot.round_movements.actions[0].events[0].name, 'bumped')
    })

    it('should update memory map on walked-on tiles, and collisioned tiles', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'down'
      robot.position = { x: 0, y: 0 }
      const memory_index = map.get_index_by_address(robot.position.x, robot.position.y + 1)

      robot.walk(1)
      assert.equal(robot.memory_map[memory_index].ground, map.layers.ground[memory_index])
      assert.equal(robot.memory_map[memory_index].obstacles, map.layers.obstacles[memory_index])
      assert.equal(robot.memory_map[memory_index].addresses, map.layers.addresses[memory_index])
    })

    it('should update robot actions list on walk', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const steps = 3
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }
      robot.walk(steps)
      let added_step = 1

      for (const action of robot.round_movements.actions) {
        assert.equal(action.name, 'walk')
        assert.equal(action.new_position.x, 0 + added_step++)
        assert.equal(action.new_position.y, 0)

      }
    })
  })

  describe('clockwise_rotate()', () => {
    it('should update robot orientation with right next orientation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'up'

      robot.turn_right()
      assert.equal(robot.orientation, 'right')
    })

    it('should update robot orientation with up if orientation before rotation is left', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_right()
      assert.equal(robot.orientation, 'up')
    })

    it('should assume multiple rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_right()
      robot.turn_right()
      robot.turn_right()

      assert.equal(robot.orientation, 'down')

    })

    it('should remove 1 battery by rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_right()

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - 1)

    })

    it('should unable rotate if energy < 1 and report by an OOE', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.battery = 0
      robot.orientation = 'left'

      robot.turn_right()
      assert.equal(robot.orientation, 'left')
      assert.equal(robot.round_movements.actions[0].name, 'OOE')
    })

    it('should update robot memory with orientation event', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_right()
      assert.equal(robot.round_movements.actions[0].name, 'turn-right')
    })
  })

  describe('turn_left()', () => {
    it('should update robot orientation with right next orientation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'down'

      robot.turn_left()
      assert.equal(robot.orientation, 'right')
    })

    it('should update robot orientation with left if orientation before rotation is up', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'up'

      robot.turn_left()
      assert.equal(robot.orientation, 'left')
    })

    it('should assume multiple rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_left()
      robot.turn_left()
      robot.turn_left()

      assert.equal(robot.orientation, 'up')

    })

    it('should remove 1 battery by rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_left()

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - 1)

    })

    it('should unable rotate if energy < 1 and report by an OOE', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.battery = 0
      robot.orientation = 'left'

      robot.turn_left()
      assert.equal(robot.orientation, 'left')
      assert.equal(robot.round_movements.actions[0].name, 'OOE')
    })

    it('should update robot memory with orientation event', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'

      robot.turn_left()
      assert.equal(robot.round_movements.actions[0].name, 'turn-left')
    })
  })

  describe('jump()', () => {
    it('should replace robot 2 tiles in front of him', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'down'
      robot.position = { x: 0, y: 0 }
      const original_position = robot.position
      robot.jump()

      assert.equal(robot.position.x, original_position.x)
      assert.equal(robot.position.y, original_position.y + 2)
    })

    it('should not jump if energy < 4', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }
      robot.battery = 3

      robot.jump()
      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)
    })

    it('should discover all jumped tiles', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }
      const original_position = robot.position
      robot.jump()

      const map_layers1 = map.get_tiles_layers([{ x: original_position.x + 1, y: original_position.y }])[0]
      const map_layers2 = map.get_tiles_layers([{ x: original_position.x + 2, y: original_position.y }])[0]

      for (const layer in map_layers1) {
        assert.equal(map_layers1[layer], robot.memory_map[robot.map.get_index_by_address(original_position.x + 1, original_position.y)][layer])
      }

      for (const layer in map_layers2) {
        assert.equal(map_layers2[layer], robot.memory_map[robot.map.get_index_by_address(original_position.x + 2, original_position.y)][layer])
      }

    })

    it('should bump on tile if it contains obstacle and destroy it, and report it', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.obstacles[map.get_index_by_address(2, 0)] = "mountain"

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }

      assert.equal(map.has_obstacle({ x: 2, y: 0 }), true)
      robot.jump()
      assert.equal(map.has_obstacle({ x: 2, y: 0 }), false)
    })

    it('should bump on wall if jump is going out of bound', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.obstacles[map.get_index_by_address(2, 0)] = "mountain"

      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'left'
      robot.position = { x: 0, y: 0 }

      robot.jump()
      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)

    })

    it('should bump on adversary and hurt him for 15hp', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)


      const robot = new game_classes.Robot('default', map, user_ids[0])
      const opponent = new game_classes.Robot('default', map, user_ids[0])
      opponent.position = { x: 2, y: 0 }
      map.set_enemy_robots([opponent])

      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }

      robot.jump()
      assert.equal(opponent.hp, game_classes.Robot.models[opponent.model].hp - 15)
      assert.equal(robot.position.x, 1)
      assert.equal(robot.position.y, 0)
    })

    it('should place robot on middle tile on bumping', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.obstacles[map.get_index_by_address(2, 0)] = "mountain"


      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }

      robot.jump()
      assert.equal(robot.position.x, 1)
      assert.equal(robot.position.y, 0)
    })

    it('should place robot on original tile on bumping if middle tile has obstacle', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.obstacles[map.get_index_by_address(2, 0)] = "mountain"
      map.layers.obstacles[map.get_index_by_address(1, 0)] = "mountain"


      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.orientation = 'right'
      robot.position = { x: 0, y: 0 }

      robot.jump()
      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)
    })
  })
})

describe('check()', () => {
  it('should update robot memory with cone of 9 tiles in front of him', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)

    const robot = new game_classes.Robot('default', map, user_ids[0])
    robot.orientation = 'up'
    robot.position = { x: 3, y: 3 }
    robot.check()
    console.log(robot.memory_map)
  })

  it.skip('should not update anything if some of the checked tiles are OOB', () => {

  })

  it.skip('should update robot memory', () => {

  })
})

describe('hit()', () => {
  it('can trigger only on robot battery > 2', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    robot.battery = 1

    robot.hit()

    assert.equal(robot.round_movements.actions[0].name, 'OOE')

  })

  it('remove 2 battery on trigger', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)

    robot.hit()

    assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - 2)

  })

  it('should damage opponent robot by robot.damage if opponent is on a tile in front of robot', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    robot.position = { x: 3, y: 3 }
    robot.orientation = 'up'

    const opponent = new game_classes.Robot('default', map, user_ids[0])
    const initial_hp = opponent.hp
    opponent.position = { x: 3, y: 2 }

    map.set_enemy_robots([opponent])

    robot.hit()

    assert.equal(opponent.hp, initial_hp - game_classes.Robot.models[robot.model].damage)
  })

  it('should destroy obstacle if obstacle is in range', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])

    robot.position = { x: 3, y: 3 }
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    const obstacle_index = map.get_index_by_address(robot.position.x, robot.position.y - 1)
    robot.orientation = 'up'

    map.layers.obstacles[obstacle_index] = 'mountain'

    assert.equal(map.has_obstacle({ x: robot.position.x, y: robot.position.y - 1 }), true)
    robot.hit()
    assert.equal(map.has_obstacle({ x: robot.position.x, y: robot.position.y - 1 }), false)
  })

  it.skip('should update robot actions list', () => {

  })
})

describe('get_memorized_tiles()', () => {
  it('should return robot memorized tiles', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    robot.orientation = 'down'

    robot.check()
    assert.equal(robot.get_memorized_tiles().length, 6)
  })

  it.skip('should not return any tiles containing "not_discovered"', () => {

  })
})

describe('get_hit()', () => {
  it('should make robot lose hp equals to opponent robot attack', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    const damage = game_classes.Robot.models.default.damage
    map.set_enemy_robots([robot])

    const initial_hp = game_classes.Robot.models[robot.model].hp
    robot.get_hit(damage, map)
    assert.equal(robot.hp, initial_hp - damage)
  })

  it('should return hit action if robot is still alive', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    const damage = game_classes.Robot.models.default.damage
    map.set_enemy_robots([robot])

    const result = robot.get_hit(damage, map)

    assert.equal(result.name, 'get-hit')
    assert.equal(result.damage, damage)
    assert.equal(result.robot_id, robot.robot_id)
  })

  it('should return die action if robot is dead on hit', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    const index = map.get_index_by_address(robot.position.x, robot.position.y)
    const damage = game_classes.Robot.models.default.damage
    map.set_enemy_robots([robot])
    robot.hp = 10

    const result = robot.get_hit(damage, map)

    assert.equal(result.name, 'die')
    assert.equal(result.robot_id, robot.robot_id)
  })
})

describe('die()', () => {
  it('should lay scraps on the ground', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    robot.position = { x: 0, y: 3, }
    const index = map.get_index_by_address(robot.position.x, robot.position.y)

    map.set_enemy_robots([robot])

    robot.die(map)

    const result = map.layers.items[index][0]
    assert.equal("scraps", result)
  })

  it('should remove robot from opponent layer', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    robot.position = { x: 0, y: 3, }
    const index = map.get_index_by_address(robot.position.x, robot.position.y)

    map.set_enemy_robots([robot])

    assert.equal(map.layers.opponent[index], robot)
    robot.die(map)
    assert.equal(map.layers.opponent[index], null)
  })

  it('should return action properly shaped for death', () => {
    const field = game_services.generate_field()
    const map = new game_classes.Map(field)
    const robot = new game_classes.Robot('default', map, user_ids[0])
    robot.position = { x: 0, y: 3, }
    const index = map.get_index_by_address(robot.position.x, robot.position.y)

    map.set_enemy_robots([robot])
    const action = robot.die(map)

    assert.equal(action.name, "die")
    assert.equal(action.robot_id, robot.robot_id)
    assert.equal(action.events[0].name, 'lay-scraps')
    assert.equal(action.events[0].address.x, robot.position.x)
    assert.equal(action.events[0].address.y, robot.position.y)
  })
})

describe('map', () => {
  describe('initialization(field)', () => {
    it('should initialized map on passed map layers, and instantiate the edge size depending of the field size', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      assert.notEqual(map.layers.addresses, null)
      assert.notEqual(map.layers.ground, null)
      assert.notEqual(map.layers.obstacles, null)

      assert.equal(map.square_size, Math.sqrt(map.layers.addresses.length))

    })
  })

  describe('get_tile_layers(address[])', () => {
    it('should return all of the layer on any number of addresses passed', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.ground = Array(map.square_size * map.square_size).fill('grass')

      const test = map.get_tiles_layers([{ x: 0, y: 0 }])[0]

      assert.equal(test.ground, 'grass')
      assert.equal(test.obstacles, null)
      assert.equal(test.addresses.x, 0)
      assert.equal(test.addresses.y, 0)

    })
  })

  describe('has_obstacle', () => {
    it('should return true if any obstacle is present', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill('ruins')
      map.layers.ground = Array(map.square_size * map.square_size).fill('water')

      const test = map.has_obstacle({ x: 0, y: 0, })

      assert.equal(test, true)
    })

    it('should return true if any a robot is present on the tile', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.position = { x: 0, y: 3, }

      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.ground = Array(map.square_size * map.square_size).fill('water')
      map.set_enemy_robots([robot])

      const test = map.has_obstacle({ x: 0, y: 3, })

      assert.equal(test, true)
    })

    it('should return false if nor robot nor obstacle are present on the tile', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const robot = new game_classes.Robot('default', map, user_ids[0])
      robot.position = { x: 0, y: 3, }

      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.ground = Array(map.square_size * map.square_size).fill('water')
      map.set_enemy_robots([robot])

      const test = map.has_obstacle({ x: 0, y: 4, })

      assert.equal(test, false)
    })
  })

  describe('is_inbound(x, y)', () => {
    it('should return true if passed x, y are both in map range', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      assert.equal(true, map.is_inbound(0, 0))
    })

    it('should return false if it is out of range', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      assert.equal(false, map.is_inbound(map.square_size, 0))

    })
  })

  describe('update_memory_robot(robot, addresses)', () => {
    it('should update all tiles for the passed robot', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const robot = new game_classes.Robot('default', map, user_ids[0])

      const address = { x: 0, y: 0 }
      const index = map.get_index_by_address(address.x, address.y)

      const excepted_value = {
        ground: map.layers.ground[index],
        obstacles: map.layers.obstacles[index],
        addresses: map.layers.addresses[index]
      }

      robot.map.update_robot_memory(robot, [address])

      assert.equal(robot.memory_map[index].ground, excepted_value.ground)
      assert.equal(robot.memory_map[index].obstacles, excepted_value.obstacles)
      assert.equal(robot.memory_map[index].addresses, excepted_value.addresses)
    })
  })

  describe('get_enemy_on_tile(x, y)', () => {
    it('should return robot if passed address contain one', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = { position: { x: 0, y: 2 } }
      map.set_enemy_robots([robot])

      assert.equal(robot, map.get_enemy_on_tile(robot.position))
    })

    it('should return null if it is not on tile', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = { position: { x: 0, y: 2 } }
      map.set_enemy_robots([robot])

      assert.equal(null, map.get_enemy_on_tile({ x: 0, y: 3 }))

    })
  })

  describe("set_enemy_robots()", () => {
    it("should position robot on according tile on opponent layer", () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = { position: { x: 0, y: 2 } }
      const robot1 = { position: { x: 0, y: 3 } }
      const robot2 = { position: { x: 0, y: 4 } }
      map.set_enemy_robots([robot, robot1, robot2])

      assert.equal(robot, map.layers.opponent[map.get_index_by_address(robot.position.x, robot.position.y)])
      assert.equal(robot1, map.layers.opponent[map.get_index_by_address(robot1.position.x, robot1.position.y)])
      assert.equal(robot2, map.layers.opponent[map.get_index_by_address(robot2.position.x, robot2.position.y)])
    })
  })

  describe("get_hitted_tiles()", () => {
    it("should return the 3 cases in font of the robot, depending of its orientation", () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])

      robot.position = { x: 3, y: 3 }
      robot.orientation = 'down'

      const tiles = map.get_hitted_tiles(robot)

      assert.equal(tiles[0].y, robot.position.y + 1)
      assert.equal(tiles[0].x, robot.position.x - 1)
      assert.equal(tiles[1].x, robot.position.x)
      assert.equal(tiles[2].x, robot.position.x + 1)

    })
  })

  describe("get_jumped_tiles()", () => {
    it("should return the 2 cases in line in front of the robot, and the robot position, depending of its orientation", () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = new game_classes.Robot('default', map, user_ids[0])

      robot.position = { x: 3, y: 3 }
      robot.orientation = 'down'

      const tiles = map.get_jumped_tiles(robot)

      assert.equal(tiles[0].x, robot.position.x)
      assert.equal(tiles[0].y, robot.position.y + 2)
      assert.equal(tiles[1].y, robot.position.y + 1)
      assert.equal(tiles[2].y, robot.position.y)


    })
  })
})  