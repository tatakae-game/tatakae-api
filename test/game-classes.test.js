import { strict as assert, AssertionError } from 'assert'

import game_classes from '../src/socket-endpoints/game-classes'
import * as game_services from '../src/services/game.service'

describe('robot', () => {

  describe('initialization', () => {

    describe('model', () => {
      it('should initialize robot depending of passed model', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('default', map)

        assert.equal(robot.hp, game_classes.Robot.models[robot.model].hp)
        assert.equal(robot.model, 'default')
      })

      it('should initialize robot as default if model doesnt exist', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('cat', map)

        assert.equal(robot.model, 'default')
        assert.equal(robot.hp, game_classes.Robot.models[robot.model].hp)
      })

      it('should initialize robot memory map filled with undiscovered tiles', () => {
        const map = { square_size: 5 }
        const robot = new game_classes.Robot('default', map)

        for (const undiscovered_map of robot.memory_map) {
          assert.equal(undiscovered_map, 'not_discovered')
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

      const robot = new game_classes.Robot('default', map)
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

      const robot = new game_classes.Robot('default', map)
      robot.position = { x: 0, y: 0 }
      robot.walk(steps)

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - (steps * 2))
    })

    it('should move robot n-distance tiles in front of him', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)

      const robot = new game_classes.Robot('default', map)
      robot.battery = 6
      robot.position = { x: 0, y: 0 }
      robot.walk(3)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 3)
    })

    it('should stop before obstacle and report collision', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      map.layers.obstacles = Array(map.square_size * map.square_size).fill('ruins')

      const robot = new game_classes.Robot('default', map)
      robot.battery = 6
      robot.position = { x: 0, y: 0 }
      robot.walk(1)

      assert.equal(robot.position.x, 0)
      assert.equal(robot.position.y, 0)
      assert.equal(robot.round_movements.actions[0].event, 'bumped')
    })

    it.skip('should update memory map on walked-on tiles, and collisioned tiles', () => {

    })

    it.skip('should update robot actions list', () => {

    })
  })

  describe('clockwise_rotate()', () => {
    it('should update robot orientation with right next orientation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'up'

      robot.clockwise_rotation()
      assert.equal(robot.orientation, 'right')
    })

    it('should update robot orientation with up if orientation before rotation is left', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.clockwise_rotation()
      assert.equal(robot.orientation, 'up')
    })

    it('should assume multiple rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.clockwise_rotation()
      robot.clockwise_rotation()
      robot.clockwise_rotation()

      assert.equal(robot.orientation, 'down')

    })

    it('should remove 1 battery by rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.clockwise_rotation()

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - 1)

    })

    it('should unable rotate if energy < 1 and report by an OOE', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.battery = 0
      robot.orientation = 'left'

      robot.clockwise_rotation()
      assert.equal(robot.orientation, 'left')
      assert.equal(robot.round_movements.actions[0].action, 'OOE')
    })

    it('should update robot memory with orientation event', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.clockwise_rotation()
      assert.equal(robot.round_movements.actions[0].action, 'turn-right')
    })
  })

  describe('reverse_clockwise_rotation()', () => {
    it('should update robot orientation with right next orientation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'down'

      robot.reverse_clockwise_rotation()
      assert.equal(robot.orientation, 'right')
    })

    it('should update robot orientation with left if orientation before rotation is up', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'up'

      robot.reverse_clockwise_rotation()
      assert.equal(robot.orientation, 'left')
    })

    it('should assume multiple rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.reverse_clockwise_rotation()
      robot.reverse_clockwise_rotation()
      robot.reverse_clockwise_rotation()

      assert.equal(robot.orientation, 'up')

    })

    it('should remove 1 battery by rotation', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.reverse_clockwise_rotation()

      assert.equal(robot.battery, game_classes.Robot.models[robot.model].battery - 1)

    })

    it('should unable rotate if energy < 1 and report by an OOE', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.battery = 0
      robot.orientation = 'left'

      robot.reverse_clockwise_rotation()
      assert.equal(robot.orientation, 'left')
      assert.equal(robot.round_movements.actions[0].action, 'OOE')
    })

    it('should update robot memory with orientation event', () => {
      const map = { square_size: 5 }
      const robot = new game_classes.Robot('default', map)
      robot.orientation = 'left'

      robot.reverse_clockwise_rotation()
      assert.equal(robot.round_movements.actions[0].action, 'turn-left')
    })
  })

  describe('jump()', () => {
    it.skip('should replace robot 2 tiles in front of him', () => {

    })

    it.skip('should ignore jumped tile type, whatever it contains, and not discover it', () => {

    })

    it.skip('should bump on tile if it contains obstacle and destroy it', () => {

    })

    it.skip('should bump on wall if jump is going out of bound', () => {

    })

    it.skip('should bump on adversary and hurt him for 5hp', () => {

    })

    it.skip('should place robot on middle tile on bumping', () => {

    })

    it.skip('should place robot on original tile on bumping if middle tile has obstacle', () => {

    })

    it.skip('should remove 1hp to robot on bumping', () => {

    })

    it.skip('should update robot actions list on every cases', () => {

    })
  })
})

describe('check()', () => {
  it.skip('should update robot memory with cone of 9 tiles in front of him', () => {

  })

  it.skip('should not update anything if some of the checked tiles are OOB', () => {

  })

  it.skip('should update robot memory', () => {

  })
})

describe('hit.skip()', () => {
  it.skip('can trigger only on robot battery > 2', () => {

  })

  it.skip('should damage opponent robot by 3 if opponent is on a tile in front of robot', () => {

  })

  it.skip('should not damage opponent when opponent are next attacking robot but not in front', () => {

  })

  it.skip('should update robot actions list', () => {

  })
})

describe('eat()', () => {
  it.skip('should restore robot hp on scrubs on the tile', () => {

  })

  it.skip('should not restore robot hp if no scrubs on the tile', () => {

  })

  it.skip('should not restore robot hp if robot hp are full', () => {

  })

  it.skip('should consume scrubs on action', () => {

  })

  it.skip('should update robot actions list', () => {

  })
})

describe('die()', () => {
  it.skip('should lay scrubs on the ground', () => {

  })

  it.skip('should update robot actions list', () => {

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
      const robot = new game_classes.Robot('default', map)
      robot.position = { x: 0, y: 3, }

      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.ground = Array(map.square_size * map.square_size).fill('water')
      map.enemy_robots.push(robot)

      const test = map.has_obstacle({ x: 0, y: 3, })

      assert.equal(test, true)
    })

    it('should return false if nor robot nor obstacle are present on the tile', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)
      const robot = new game_classes.Robot('default', map)
      robot.position = { x: 0, y: 3, }

      map.layers.obstacles = Array(map.square_size * map.square_size).fill(null)
      map.layers.ground = Array(map.square_size * map.square_size).fill('water')
      map.enemy_robots.push(robot)

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
      const robot = new game_classes.Robot('default', map)

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
      map.enemy_robots.push(robot)

      assert.equal(robot, map.get_enemy_on_tile(robot.position))
    })

    it('should return null if it is not on tile', () => {
      const field = game_services.generate_field()
      const map = new game_classes.Map(field)

      const robot = { position: { x: 0, y: 2 } }
      map.enemy_robots.push(robot)

      assert.equal(null, map.get_enemy_on_tile({ x: 0, y: 3 }))

    })
  })
})  