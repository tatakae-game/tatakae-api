import { strict as assert, AssertionError } from 'assert'

import game_classes from '../src/socket-endpoints/game-classes'

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

    describe('actions', () => {
      it('should update robot action lists on any actions', () => {

      })

      it('should update robot actions on action errors', () => {

      })
    })

    describe('walk(distance)', () => {
      it('should not allow movement on battery < 2', () => {

      })

      it('should remove 2 * n-distance battery for every movement', () => {

      })

      it('should move robot n-distance tiles in front of him', () => {

      })

      it('should stop and report collision', () => {

      })

      it('should update memory map on walked-on tiles, and collisioned tiles', () => {

      })

      it('should update robot actions list', () => {

      })
    })

    describe('jump()', () => {
      it('should replace robot 2 tiles in front of him', () => {

      })

      it('should ignore jumped tile type, whatever it contains, and not discover it', () => {

      })

      it('should bump on tile if it contains obstacle and destroy it', () => {

      })

      it('should bump on wall if jump is going out of bound', () => {

      })

      it('should bump on adversary and hurt him for 5hp', () => {

      })

      it('should place robot on middle tile on bumping', () => {

      })

      it('should place robot on original tile on bumping if middle tile has obstacle', () => {

      })

      it('should remove 1hp to robot on bumping', () => {

      })

      it('should update robot actions list on every cases', () => {

      })
    })
  })

  describe('check()', () => {
    it('should update robot memory with cone of 9 tiles in front of him', () => {

    })

    it('should not update anything if some of the checked tiles are OOB', () => {

    })

    it('should update robot memory', () => {

    })
  })

  describe('hit()', () => {
    it('can trigger only on robot battery > 2', () => {

    })

    it('should damage opponent robot by 3 if opponent is on a tile in front of robot', () => {

    })

    it('should not damage opponent when opponent are next attacking robot but not in front', () => {

    })

    it('should update robot actions list', () => {

    })
  })

  describe('eat()', () => {
    it('should restore robot hp on scrubs on the tile', () => {

    })

    it('should not restore robot hp if no scrubs on the tile', () => {

    })
    
    it('should not restore robot hp if robot hp are full', () => {

    })

    it('should consume scrubs on action', () => {

    })

    it('should update robot actions list', () => {

    })
  })

  describe('die()', () => {
    it('should lay scrubs on the ground', () => {

    })

    it('should update robot actions list', () => {

    })
  })
})

describe('map', () => {
  
})  