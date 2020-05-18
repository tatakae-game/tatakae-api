class Robot {

  onTest = false

  class_tests = {
    actions: [],
  }

  isRunning = true

  static models = {
    default: {
      hp: 50,
      battery: 2,
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
   * Tiles checkers
   */

  return_last_available_tile(contested_tiles) {
    let x = this.position.x
    let y = this.position.y
    for (const tile of contested_tiles) {
      if (this.position.x !== tile.x) {
        if (tile.x < this.field.field_size && tile.x >= 0) {
          x = tile.x
        }
      } else if (this.position.y !== tile.y) {
        if (tile.y < this.field.field_size && tile.y >= 0) {
          y = tile.y
        }
      }
    }

    return { x, y }
  }

  get_contested_tiles(range, spread) {
    const tiles = []
    switch (this.orientation) {
      case 'up':
        for (let i = 0; i < range; i++) {
          if (spread && i !== 0) {

            for (let j = this.position.x - i; j <= this.position.x + i; j++) {
              tiles.push({ x: j, y: this.position.y + i + 1 })
            }
          } else {
            tiles.push({ x: this.position.x, y: this.position.y + i + 1 })
          }
        }

        break

      case 'down':

        for (let i = 0; i < range; i++) {
          if (spread && i !== 0) {

            for (let j = this.position.x - i; j <= this.position.x + i; j++) {
              tiles.push({ x: j, y: this.position.y - i - 1 })
            }
          } else {
            tiles.push({ x: this.position.x, y: this.position.y - i - 1 })
          }
        }
        break

      case 'left':

        for (let i = 0; i < range; i++) {
          if (spread && i !== 0) {

            for (let j = this.position.y - i; j <= this.position.y + i; j++) {
              tiles.push({ x: this.position.x + i + 1, y: j })
            }
          } else {
            tiles.push({ x: this.position.x - i - 1, y: this.position.y })
          }
        }
        break

      case 'right':

        for (let i = 0; i < range; i++) {
          if (spread && i !== 0) {

            for (let j = this.position.y - i; j <= this.position.y + i; j++) {
              tiles.push({ x: this.position.x - i - 1, y: j })
            }
          } else {
            tiles.push({ x: this.position.x + i + 1, y: this.position.y })
          }
        }
        break

    }

    return tiles
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
      this.orientation = this.directions[(this.directions.indexOf(this.orientation) + 1) % this.directions.length]
      this.round_movements.actions.push({
        action: 'turn',
        new_orientation: this.orientation,
      })
    }
  }

  reverse_clockwise_rotation() {
    if (!this.isRunning) {
      return
    }

    if (this.battery >= 1) {
      this.battery -= 1
      this.orientation = this.directions[(this.directions.indexOf(this.orientation) - 1 + this.directions.length) % this.directions.length]
      this.round_movements.actions.push({
        action: 'turn',
        new_orientation: this.orientation,
      })
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
        this.map.update_robot_memory(robot, [new_position])

        this.round_movements.actions.push(movement)
      } else {
        this.isRunning = false
      }
    }
  }

  update_robot_memory(tiles_checked) {
    for (const tile_layers of tiles_checked) {
      if (tile_layers[0] !== 'limit') {
        this.memory_map[this.convert_coordonates_to_array_address(tile_layers[2].x, tile_layers[2].y)] = tile_layers
      }
    }
  }

  check() {
    if (!this.isRunning) {
      return
    }

    const tiles_coordonates = this.get_contested_tiles(3, true)
    if (this.battery >= 1) {
      this.battery -= 1
      const check_action = {
        action: 'check',
        tiles_checked: this.convert_tiles_coordonates_to_tile_layers(tiles_coordonates),
      }
      this.update_robot_memory(check_action.tiles_checked)

      this.round_movements.actions.push(check_action)
    }
  }

  pass() {
    this.isRunning = false
    this.round_movements.actions.push({ action: 'wait' })
  }
}

class Map {

  static directions = ['up', 'right', 'down', 'left']

  enemy_robots = []

  /**
   * data instantiation
   */

  constructor(layers) {
    this.layers = {
      ground: layers[0].tiles,
      obstacles: layers[1].tiles,
      addresses: layers[2].tiles,
    }

    this.square_size = Math.sqrt(layers[0].tiles.length)

  }

  from_instance(instance, robot, enemy_robots) {
    const map = new Map(instance.layers)

    for (const property in instance) {
      map[property] = instance[property]
    }

    this.robot = robot
    for (const enemy_robot of enemy_robots) {
      robot.push(enemy_robot)
    }

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
    for (const enemy_robot of this.enemy_robots) {
      if (enemy_robot.position.x === tile_address.x && enemy_robot.position.y === tile_address.y) {
        return enemy_robot
      }
    }

    return null
  }

  is_inbound(x, y) {
    if (x >= 0 && x < this.square_size && y >= 0 && y < this.square_size) {
      return true
    }
    return false
  }

  update_robot_memory(robot, tiles_addresses) {
    const tiles_layers = this.get_tiles_layers(tiles_addresses)
    console.log(tiles_layers)
    for (const tile_layers of tiles_layers) {
      robot.memory_map[this.get_index_by_address(tile_layers.addresses.x, tile_layers.addresses.y)] = tile_layers
    }
  }

}

export default { Robot, Map }
