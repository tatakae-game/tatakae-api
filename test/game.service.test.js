import { strict as assert } from 'assert'
import * as game_constants from '../src/constants/game'
import * as game_service from '../src/services/game.service'

describe('generate_field()', () => {
  it('should return a map of 3 layers', () => {
    const field = game_service.generate_field()
    assert.equal(Object.keys(field).length, game_constants.LAYERS.length)
  })
})

describe('update robot()', () => {
  it.skip('should update robot following round events', () => {

  })
})

describe('end_game()', () => {
  it.skip('should update users score', () => {

  })
})


describe('randomize_initial_robot_position()', () => {
  it.skip('should place robot on a random position on opposed sides, facing each other', () => {
    
  })
})