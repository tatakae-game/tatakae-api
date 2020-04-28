
import { strict as assert, AssertionError } from 'assert'

import gameClasses from '../src/socket-endpoints/game-classes'

describe('robot', () => {

  describe('initialization', () => {

    describe('model', () => {
      it('should initialize robot depending of passed model', () => {
        const map = { square_size: 5 }
        const robot = new gameClasses.Robot('default', map)

        assert.equal(robot.hp, gameClasses.Robot.models[robot.model].hp)
        assert.equal(robot.model, 'default')
      })

      it('should initialize robot as default if model doesnt exist', () => {
        const map = { square_size: 5 }
        const robot = new gameClasses.Robot('cat', map)

        assert.equal(robot.model, 'default')
        assert.equal(robot.hp, gameClasses.Robot.models[robot.model].hp)
      })

      it('should initialize robot memory map filled with undiscovered tiles', () => {
        const map = { square_size: 5 }
        const robot = new gameClasses.Robot('default', map)

        for(const undiscovered_map of robot.memory_map) {
          assert.equal(undiscovered_map, 'not_discovered')
        }
      })

      
    })
  })
})