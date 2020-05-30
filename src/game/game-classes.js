class Robot {

  is_running = true
  status = 'alive'

  static models = {
    default: {
      hp: 50,
      battery: 10,
      damage: 10,
      moove_costs: {
        WALK: 1,
        JUMP: 4,
        HIT: 2,
        CHECK: 1,
        ROTATE: 1,
      }
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
  constructor(model, map, user_id) {
    this.model = model
    this.position = { x: 0, y: 0 }
    this.orientation = 'up'
    this.map = map
    this.robot_id = user_id

    if (!Robot.models[model]) {
      this.model = 'default'
    }

    for (const property in Robot.models[this.model]) {
      this[property] = Robot.models[this.model][property]
    }

    this.memory_map = Array(map.square_size * map.square_size).fill('not_discovered')
  }

  static from_instance(instance, map) {
    const new_robot = new Robot(instance.modele, map, instance.robot_id)

    for (const property in instance) {
      new_robot[property] = instance[property]
    }

    return new_robot
  }

  /**
   * Robot actions
   */
  clockwise_rotation() {
    if (!this.is_running) {
      return
    }

    const cost = Robot.models[this.model].moove_costs.ROTATE

    if (this.battery >= cost) {
      this.battery -= cost
      const new_orientation_index = (Map.directions.indexOf(this.orientation) + 1) % Map.directions.length
      this.orientation = Map.directions[new_orientation_index]
      this.round_movements.actions.push({
        name: 'turn-right',
        new_orientation: this.orientation,
        robot_id: this.robot_id,
      })
    } else {
      this.out_of_energy()
    }
  }

  reverse_clockwise_rotation() {
    if (!this.is_running) {
      return
    }

    const cost = Robot.models[this.model].moove_costs.ROTATE

    if (this.battery >= cost) {
      this.battery -= cost
      const new_orientation_index = (Map.directions.indexOf(this.orientation) - 1 + Map.directions.length) % Map.directions.length
      this.orientation = Map.directions[new_orientation_index]
      this.round_movements.actions.push({
        name: 'turn-left',
        new_orientation: this.orientation,
        robot_id: this.robot_id,
      })
    } else {
      this.out_of_energy()
    }
  }

  walk(steps) {
    if (!this.is_running) {
      return
    }

    const cost = Robot.models[this.model].moove_costs.WALK

    for (let i = 0; i < steps; i++) {
      if (this.battery >= cost) {
        this.battery -= cost

        const new_position = this.map.try_step(this)

        const movement = {
          name: 'walk',
          new_position,
          robot_id: this.robot_id,
          // item have to be encapsulated in array to match check format
          events: [],
          tiles_checked: [this.map.get_tiles_layers([new_position])[0]]
        }

        if (JSON.stringify(this.position) === JSON.stringify(new_position)) {
          movement.events.push({
            name: "bumped"
          })
        } else {
          this.position = new_position
        }

        this.map.update_robot_memory(this, [new_position])

        this.round_movements.actions.push(movement)
      } else {
        this.out_of_energy()
      }
    }
  }

  check() {
    if (!this.is_running) {
      return
    }

    const cost = Robot.models[this.model].moove_costs.CHECK

    if (this.battery >= cost) {
      this.battery -= cost
      const tiles_coordonates = this.map.check_tiles(this)
      const check_action = {
        name: 'check',
        tiles_checked: this.map.get_tiles_layers(tiles_coordonates),
        robot_id: this.robot_id,
      }
      this.map.update_robot_memory(this, tiles_coordonates)

      this.round_movements.actions.push(check_action)
    } else {

      robot.out_of_energy()
    }
  }

  pass() {
    this.is_running = false
    this.round_movements.actions.push({
      name: 'wait',
      robot_id: this.robot_id,
    })
  }

  out_of_energy() {
    this.is_running = false
    this.round_movements.actions.push({
      name: 'OOE',
      robot_id: this.robot_id,
    })
  }

  hit() {
    if (!this.is_running) {
      return
    }
    const cost = Robot.models[this.model].moove_costs.HIT

    if (this.battery >= cost) {
      this.battery -= cost
      const tile_hitted = this.map.get_hitted_tiles(this)


      const actions = [{
        name: "hit",
        events: [],
        robot_id: this.robot_id,
      }]

      for (const tile of tile_hitted) {
        this.map.resolve_tile_hit(tile, this, actions)

      }

      for (const action of actions) {
        this.round_movements.actions.push(action)
      }

    } else {

      this.out_of_energy()
    }
  }

  get_hit(damage, map) {
    this.hp -= damage
    if (this.hp <= 0) {
      return this.die(map)
    } else {

      return {
        name: "get-hit",
        damage,
        robot_id: this.robot_id
      }
    }
  }

  die(map) {
    const index = map.get_index_by_address(this.position.x, this.position.y)
    if (map.layers.opponent[index]) {
      map.layers.items[index].push("scraps")
    }

    map.layers.opponent[index] = null

    return {
      name: 'die',
      robot_id: this.robot_id,
      events: [
        {
          event: 'lay-scraps',
          address: this.position,
        }
      ]
    }

  }

  jump() {
    if (!this.is_running) {
      return
    }

    const cost = Robot.models[this.model].moove_costs.JUMP


    if (this.battery >= cost) {
      this.battery -= cost
      const tiles_jumped = this.map.get_jumped_tiles(this)
      const actions = this.map.resolve_jump(tiles_jumped, this)
      for (const action of actions) {
        this.round_movements.actions.push(action)
      }

    } else {
      this.out_of_energy()
    }
  }

}

class Map {

  static directions = ['up', 'right', 'down', 'left']

  /**
   * data instantiation
   */

  constructor(layers) {
    this.layers = layers

    this.square_size = Math.sqrt(this.layers.ground.length)

  }

  static from_instance(instance, robot, enemy_robots) {
    const map = new Map(instance.layers)

    for (const property in instance) {
      map[property] = instance[property]
    }

    map.robot = robot

    map.set_enemy_robots(enemy_robots)

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

  /**
   * @param {Robot} robot 
   */
  get_hitted_tiles(robot) {
    const tiles = []
    const x = robot.position.x
    const y = robot.position.y

    switch (robot.orientation) {
      case 'up':
        for (let i = -1; i < 2; i++) {
          const address = { x: x + i, y: y + 1 }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'right':
        for (let i = -1; i < 2; i++) {
          const address = { x: x + 1, y: y - i }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'down':
        for (let i = -1; i < 2; i++) {
          const address = { x: x + i, y: y - 1 }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'left':
        for (let i = -1; i < 2; i++) {
          const address = { x: x - 1, y: y - i }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break
    }
    return tiles
  }

  resolve_tile_hit(tile_address, robot, actions) {

    const tile_layers = this.get_tiles_layers([tile_address])[0]

    if (tile_layers.obstacles) {
      actions[0].events.push({
        name: "destroy",
        obstacle: tile_layers.obstacles,
        address: tile_layers.addresses
      })

      this.layers.obstacles[this.get_index_by_address(tile_address.x, tile_address.y)] = null
    }

    if (tile_layers.opponent) {
      const opponent_action = tile_layers.opponent.get_hit(robot.damage, this)
      actions.push(opponent_action)
    }
  }

  get_jumped_tiles(robot) {
    const tiles = []
    const x = robot.position.x
    const y = robot.position.y

    switch (robot.orientation) {
      case 'up':
        for (let i = 2; i >= 0; i--) {
          const address = { x, y: y + i }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'right':
        for (let i = 2; i >= 0; i--) {
          const address = { x: x + i, y }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'down':
        for (let i = 2; i >= 0; i--) {
          const address = { x, y: y - i }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break

      case 'left':
        for (let i = 2; i >= 0; i--) {
          const address = { x: x - i, y }
          if (this.is_inbound(address.x, address.y)) {
            tiles.push(address)
          }
        }
        break
    }
    return tiles
  }

  /**
   * 
   * @param {{x: number, y: number}[]} tiles_jumped 
   * @param {Robot} robot 
   */
  resolve_jump(tiles_jumped, robot) {

    const max_range_tile = tiles_jumped[0]
    const middle_tile = tiles_jumped[1] ? tiles_jumped[1] : tiles_jumped[0]
    const actions = []

    const action = {
      name: 'jump',
      robot_id: robot.robot_id,
      events: [],
    }

    robot.map.update_robot_memory(robot, tiles_jumped)

    if (!this.has_obstacle(max_range_tile)) {
      robot.position = max_range_tile
      action.new_position = max_range_tile
      actions.push(action)

      return actions

    } else if (this.get_enemy_on_tile(max_range_tile)) {
      const opponent_action = this.get_enemy_on_tile(max_range_tile).get_hit(15, this)
      action.events.push({ name: 'bumped' })

      actions.push(action)
      actions.push(opponent_action)

    } else {

      action.events.push({
        event: "destroy",
        obstacle: this.layers.obstacles[this.get_index_by_address(max_range_tile.x, max_range_tile.y)],
        address: max_range_tile,
      })

      actions.push(action)

      this.layers.obstacles[this.get_index_by_address(max_range_tile.x, max_range_tile.y)] = null
    }


    if (this.has_obstacle(middle_tile)) {
      actions[0].new_position = robot.position
    } else {
      actions[0].new_position = middle_tile
      robot.position = middle_tile
    }


    return actions
  }
}

export default { Robot, Map }
