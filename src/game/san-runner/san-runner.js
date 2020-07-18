import game_classes from '../game-classes'
import { replace_main_name } from '../../services/code.service'
import * as fs from 'fs'
import * as path from 'path'
import { execute_code, test } from '../../services/playrground_service'

export class SanRunner {

    constructor(user, map) {
        this.map = map
        this.language = 'san'
        this.robot = new game_classes.Robot(user.robot, map, user._id)
        this.code = user.san_code
    }

    async ready_code() {
        const entrypoint = this.code.filter(file => file.is_entrypoint === true)[0]
        entrypoint.code = replace_main_name(entrypoint.code)

        entrypoint.code = await this.encapsulate_code(entrypoint.code)
        this.code.push(await this.get_robot_file())
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
                if (memory_map[index] === 'not_discovered') {
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
            position: this.robot.position,
            memory_map: this.convert_memory_map(this.robot.memory_map),
            robot_id: this.robot.robot_id,
            hp: this.robot.hp,

        }
    }

    async encapsulate_code(entrypoint_code) {
        const game_code_promise = new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, './san-game-code.sn'), (err, data) => {
                if (err) {
                    return reject(err)
                } else {
                    resolve(data)
                }
            })
        })

        let game_code = (await game_code_promise).toString()

        game_code = game_code.replace('{{ user_entrypoint_code }}', entrypoint_code)

        return game_code
    }

    async get_robot_file() {
        const robot_promise = new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, './robot.sn'), (err, data) => {
                if (err) {
                    return reject(err)
                } else {
                    resolve(data)
                }
            })
        })

        return {
            name: "source_robot_file.sn",
            code: (await robot_promise).toString(),
            is_entrypoint: false,
        }
    }

    convert_files_to_api_format() {
        const files = {}
        const files_array = this.code.map(file => {
            return {
                [file.name]: file.code
            }
        })

        for (const file of files_array) {
            for (const prop in file) {
                files[prop] = file[prop]
            }
        }

        return files
    }

    async test() {
        const data = {
            opponent: {
                hp: this.robot.hp,
                id: this.robot.robot_id,
            },
            map: this.convert_map(this.robot),
            robot: this.simplified_robot(),
        }

        const errors = await test(
            this.convert_files_to_api_format(),
            this.code.filter(file => file.is_entrypoint === true)[0].name,
            JSON.stringify(data)
        )

        return errors
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

        const stdout = await execute_code(
            this.convert_files_to_api_format(),
            this.code.filter(file => file.is_entrypoint === true)[0].name,
            JSON.stringify(data)
        )

        console.log(stdout)

        return stdout
        // DATA TO SEND STRINGIFIED TO SAN
    }
}