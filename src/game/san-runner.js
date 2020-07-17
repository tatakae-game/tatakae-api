import game_classes from '../game/game-classes'

export class SanRunner {

    constructor(user, map) {
        this.map = map
        this.language = 'san'
        this.robot = new game_classes.Robot(user.robot, map, user._id)
        this.code = user.san_code
    }


    convert_map(opponent) {
        let index = 0
        const tiles = []
        const size = Math.sqrt(this.map.layers.ground.length)
        for (let i = 0; i < size; i++) {
            tiles[i] = []
            for (let j = 0; j < size; j++) {
                tiles[i].push({
                    ground: this.map.layers.ground[index],
                    obstacles: this.map.layers.obstacles[index],
                    address: this.map.layers.addresses[index],
                    items: "",
                    opponent: this.map.layers.addresses[index].x === opponent.position.x && this.map.layers.addresses[index].y === opponent.position.y ? opponent.robot_id : "",
                })
                index += 1
            }
        }
        return tiles
    }

    convert_memory_map(memory_map) {
        let index = 0
        const tiles = []
        const size = Math.sqrt(this.map.layers.ground.length)
        for (let i = 0; i < size; i++) {
            tiles[i] = []
            for (let j = 0; j < size; j++) {
                if (memory_map[index] === 'not discovered') {
                    tiles[i].push(null)
                } else {
                    tiles[i].push(memory_map[index])
                }
                index += 1
            }
        }
        return tiles
    }


    simplified_robot() {
        return {
            orientation: this.robot.orientation,
            memory_map: this.convert_memory_map(this.robot.memory_map),
            robot_id: this.robot.robot_id,
            hp: this.robot.hp,

        }
    }


    async test() {
        return
    }

    async run(opponent) {
        const data = {
            opponent: {
                hp: opponent.hp,
                id: opponent.robot_id,
            },
            map: this.convert_map(opponent),
            robot: this.simplified_robot(),
        }

        // DATA TO SEND STRINGIFIED TO SAN
        console.log(data)
    }
}