import { resolve_files } from "../services/code.service"
import * as fs from 'fs'
import * as path from 'path'
import game_classes from '../game/game-classes'
import * as wandbox_service from '../services/wandbox.service'

export class JsRunner {

    /**
     * 
     * @param {*} user 
     */
    constructor(user, map) {
        this.map = map
        this.language = 'js'
        this.robot = new game_classes.Robot(user.robot, map, user._id)
        this.code = resolve_files(user.js_code)
    }

    async encapsulate_code(opponent){
        const final_code_promise = new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, './game-code.js'), (err, data) => {
              if (err) {
                return reject(err)
              } else {
                resolve(data)
              }
            })
          })
        
          const game_classes_promise = new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, './game-classes.js'), (err, data) => {
              if (err) {
                return reject(err)
              } else {
                resolve(data)
              }
            })
          })
        
          let final_code = (await final_code_promise).toString()
          let game_classes = (await game_classes_promise).toString()
        
          final_code = final_code.replace('{{ game_classes }}', (game_classes).replace(/export.*/, ''))
          final_code = final_code.replace('{{ user_robot_string }}', JSON.stringify(this.robot))
          final_code = final_code.replace('{{ map_string }}', JSON.stringify(this.map))
          final_code = final_code.replace('{{ opponent_robot_string }}', JSON.stringify(opponent))
        
        
          final_code = final_code.replace('{{ user_code }}', this.code)
        
          return final_code
    }

    async run(opponent){
        return await wandbox_service.execute_code(await this.encapsulate_code(opponent))
    }
}