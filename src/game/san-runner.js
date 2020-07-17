import game_classes from '../game/game-classes'

export class SanRunner {

    constructor(user, map) {
        this.map = map
        this.language = 'san'
        this.robot = new game_classes.Robot(user.robot, map, user._id)
        this.code = user.san_code
    }


    convert_map(opponent) {
        console.log(this.map)
        const tiles = []
        for (let i = 0; i < this.map.layers.ground.length; i++) {
            tiles.push({
                ground: this.map.layers.ground[i],
                obstacles: this.map.layers.obstacles[i],
                address: this.map.layers.addresses[i],
                items: "",
                opponent: this.map.layers.addresses[i].x === opponent.position.x && this.map.layers.addresses[i].y === opponent.position.y ? opponent.robot_id : "",
            })
        }

        console.log(tiles)

        return tiles
    }

    simplified_robot() {
        return {
            orientation: this.robot.orientation,
            memory_map: this.robot.memory_map,
            robot_id: this.robot.robot_id,
            hp: this.robot.hp,

        }
    }


    async test() {
        return
    }

    async run(opponent) {
        const data = {
            robot: this.simplified_robot(),
            opponent: {
                hp: opponent.hp,
                id: opponent.robot_id,
            },
            map: this.convert_map(opponent),
        }

        // DATA TO SEND STRINGIFIED TO SAN
        console.log(data)
    }
}