class Robot {

  onTest = false

  class_tests = {
    actions: [],
  }

  isRunning = true

  static models = {
    default: {
      hp: 50,
      battery: 10,
    },
  }

  round_movements = {
    actions: [],
  }

  /**
   * 
   * @param {String} model 
   * @param {Map} map 
   */
  constructor(model, map) {
    this.model = model
    this.position = { x: 0, y: 0 }
    this.orientation = 'up'
    this.map = map

    if (!Robot.models[model]) {
      this.model = 'default'
    }

    for (const property in Robot.models[this.model]) {
      this[property] = Robot.models[this.model][property]
    }

    this.memory_map = Array(map.square_size * map.square_size).fill('not_discovered')
  }

  static from_instance(instance) {
    const new_robot = new Robot(instance.modele, instance.field.tiles_layout)

    for (const property in instance) {
      new_robot[property] = instance[property]
    }

    return new_robot
  }

  /**
   * Robot actions
   */
  clockwise_rotation() {
    if (!this.isRunning) {
      return
    }

    if (this.battery >= 1) {
      this.battery -= 1
      const new_orientation_index = (Map.directions.indexOf(this.orientation) + 1) % Map.directions.length
      this.orientation = Map.directions[new_orientation_index]
      this.round_movements.actions.push({
        action: 'turn-right',
        new_orientation: this.orientation,
      })
    } else {
      this.out_of_energy()
    }
  }

  reverse_clockwise_rotation() {
    if (!this.isRunning) {
      return
    }

    if (this.battery >= 1) {
      this.battery -= 1
      const new_orientation_index = (Map.directions.indexOf(this.orientation) - 1 + Map.directions.length) % Map.directions.length
      this.orientation = Map.directions[new_orientation_index]
      this.round_movements.actions.push({
        action: 'turn-left',
        new_orientation: this.orientation,
      })
    } else {
      this.out_of_energy()
    }
  }

  walk(steps) {
    if (!this.isRunning) {
      return
    }

    for (let i = 0; i < steps; i++) {
      if (this.battery >= 2) {
        this.battery -= 2

        const new_position = this.map.try_step(this)

        const movement = {
          action: 'walk',
          new_position,
        }

        if (JSON.stringify(this.position) === JSON.stringify(new_position)) {
          movement.event = 'bumped'
        } else {
          this.position = new_position
        }

        //update robot memory on bumped or crossed tiles
        this.map.update_robot_memory(this, [new_position])

        this.round_movements.actions.push(movement)
      } else {
        this.out_of_energy()
      }
    }
  }

  check() {
    if (!this.isRunning) {
      return
    }


    if (this.battery >= 1) {
      const tiles_coordonates = this.map.check_tiles(this)
      this.battery -= 1
      const check_action = {
        action: 'check',
        tiles_checked: tiles_coordonates,
      }
      this.map.update_robot_memory(this, tiles_coordonates)

      this.round_movements.actions.push(check_action)
    } else {

      robot.out_of_energy()
    }
  }

  pass() {
    this.isRunning = false
    this.round_movements.actions.push({ action: 'wait' })
  }

  out_of_energy() {
    this.isRunning = false
    this.round_movements.actions.push({ action: 'OOE' })
  }
}

class Map {

  static directions = ['up', 'right', 'down', 'left']

  enemy_robots = []

  /**
   * data instantiation
   */

  constructor(layers) {
    this.layers = layers

    this.square_size = Math.sqrt(this.layers.ground.length)

  }

  from_instance(instance, robot, enemy_robots) {
    const map = new Map(instance.layers)

    for (const property in instance) {
      map[property] = instance[property]
    }

    this.robot = robot

    set_enemy_robots(enemy_robots)

    return map
  }

  /**
   * Convert address into tile layers
   */

  get_index_by_address(x, y) {
    return this.layers.addresses.findIndex((a) => a.x === x && a.y === y)
  }

  /**
   * @param {{x: number, y: number}[]} tiles_addresses 
   */
  get_tiles_layers(tiles_addresses) {
    const tiles_containts = []
    for (const address of tiles_addresses) {
      const tile_containt = {}
      const tile_index = this.get_index_by_address(address.x, address.y)
      for (const layer in this.layers) {
        tile_containt[layer] = this.layers[layer][tile_index]
      }
      tiles_containts.push(tile_containt)
    }

    return tiles_containts
  }

  set_enemy_robots(enemy_robots) {
    for (const robot of enemy_robots) {
      this.layers.opponent[this.get_index_by_address(robot.position.x, robot.position.y)] = robot
    }
  }

  /**
   * 
   * @param {Robot} robot 
   */
  try_step(robot) {
    const position = robot.position
    switch (robot.orientation) {
      case 'up':
        if (!this.has_obstacle({ x: position.x, y: position.y + 1 }) && this.is_inbound(position.x, position.y + 1)) {
          return { x: position.x, y: position.y + 1 }
        }
        break

      case 'right':
        if (!this.has_obstacle({ x: position.x + 1, y: position.y }) && this.is_inbound(position.x + 1, position.y)) {
          return { x: position.x + 1, y: position.y }
        }
        break

      case 'down':
        if (!this.has_obstacle({ x: position.x, y: position.y - 1 }) && this.is_inbound(position.x, position.y - 1)) {
          return { x: position.x, y: position.y - 1 }
        }
        break

      case 'left':
        if (!this.has_obstacle({ x: position.x - 1, y: position.y }) && this.is_inbound(position.x - 1, position.y)) {
          return { x: position.x - 1, y: position.y }
        }
        break
    }
    return robot.position
  }

  /**
  * @param {x: number, y: number} tiles_address
  */
  has_obstacle(tile_address) {
    const tile_layers = this.get_tiles_layers([{ x: tile_address.x, y: tile_address.y }])
    if (tile_layers[0].obstacles !== null || this.get_enemy_on_tile(tile_address) !== null) {
      return true
    }

    return false
  }

  /**
  * @param {x: number, y: number} tiles_address
  */
  get_enemy_on_tile(tile_address) {
    return this.layers.opponent[this.get_index_by_address(tile_address.x, tile_address.y)]
  }

  is_inbound(x, y) {
    if (x >= 0 && x < this.square_size && y >= 0 && y < this.square_size) {
      return true
    }
    return false
  }

  update_robot_memory(robot, tiles_addresses) {
    const tiles_layers = this.get_tiles_layers(tiles_addresses)
    for (const tile_layers of tiles_layers) {
      const index = this.get_index_by_address(tile_layers.addresses.x, tile_layers.addresses.y)
      robot.memory_map[index] = tile_layers
    }
  }

  check_tiles(robot) {
    const x = robot.position.x
    const y = robot.position.y
    const tiles = []

    switch (robot.orientation) {
      case 'up':
        let tile
        for (let i = 0; i < 3; i++) {
          if (i !== 0) {
            for (let j = x - i; j <= x + i; j++) {
              tile = ({ x: j, y: y + i + 1 })

              if (this.is_inbound(tile.x, tile.y)) {
                tiles.push(tile)
              }
            }
          } else {
            tile = ({ x, y: y + 1 })

            if (this.is_inbound(tile.x, tile.y)) {
              tiles.push(tile)
            }
          }

        }

        break

      case 'down':

        for (let i = 0; i < 3; i++) {
          let tile
          if (i !== 0) {

            for (let j = x - i; j <= x + i; j++) {
              tile = ({ x: j, y: y - i - 1 })

              if (this.is_inbound(tile.x, tile.y)) {
                tiles.push(tile)
              }
            }
          } else {
            tile = ({ x, y: y - i - 1 })

            if (this.is_inbound(tile.x, tile.y)) {
              tiles.push(tile)
            }
          }
        }
        break

      case 'left':

        for (let i = 0; i < 3; i++) {
          let tile
          if (i !== 0) {

            for (let j = y - i; j <= y + i; j++) {
              tile = ({ x: x - i - 1, y: j })
              if (this.is_inbound(tile.x, tile.y)) {
                tiles.push(tile)
              }
            }
          } else {
            tile = ({ x: x - i - 1, y })
            if (this.is_inbound(tile.x, tile.y)) {
              tiles.push(tile)
            }
          }
        }
        break

      case 'right':

        for (let i = 0; i < 3; i++) {
          if (i !== 0) {

            for (let j = y - i; j <= y + i; j++) {
              tile = ({ x: x + i + 1, y: j })

              if (this.is_inbound(tile.x, tile.y)) {
                tiles.push(tile)
              }
            }
          } else {
            tile = ({ x: x + i + 1, y })

            if (this.is_inbound(tile.x, tile.y)) {
              tiles.push(tile)
            }
          }
        }
        break

    }

    return tiles
  }

}

export default { Robot, Map }
