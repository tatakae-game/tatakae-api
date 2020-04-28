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

  directions = ['up', 'right', 'down', 'left']

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
      this.hp = Robot.models.default.hp
      this.battery = Robot.models.default.battery
    } else {
      this.hp = Robot.models[model].hp
      this.battery = Robot.models[model].battery
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
   * Data convertissor
   */
  convert_tiles_coordonates_to_tile_layers(tiles) {
    const tiles_layers = []
    for (const tile of tiles) {
      const tile_layers = []

      if (tile.x < 0 || tile.x > this.field.field_size || tile.y < 0 || tile.y > this.field.field_size) {
        tile_layers.push('limit')
      } else {
        for (const layer of this.field.tiles_layout) {
          tile_layers.push(layer.tiles[this.convert_coordonates_to_array_address(tile.x, tile.y)])
        }
      }

      tiles_layers.push(tile_layers)
    }

    return tiles_layers
  }

  convert_coordonates_to_array_address(x, y) {
    return this.field.tiles_layout[2].tiles.findIndex((a) => a.x === x && a.y === y)
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

        this.position = this.return_last_available_tile(this.get_contested_tiles(1, false))
        this.round_movements.actions.push({
          action: 'walk',
          new_position: this.position,
        })
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

  directions = ['up', 'right', 'down', 'left']

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
    this.enemy_robots = enemy_robots

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

  is_tile_praticable(tile_address){
    
  }

}

export default { Robot, Map }
