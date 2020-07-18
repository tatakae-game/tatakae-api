import axios from 'axios'
import * as urls from '../constants/api-url'

const playground_url = urls.PLAYGROUND_URL

export async function test(files, entrypoint, stdin) {
    try {
        const res = await axios.post(`${playground_url}/run`, {
            "files": files,
            "args": [stdin],
            "entrypoint": entrypoint,
        })

        return res.data.stderr

    } catch (e) {
        console.log(e)
    }

}

export async function execute_code(files, stdin, entrypoint) {
    try {
        const res = await axios.post(`${playground_url}/run`, {
            "files": files,
            "stdin": stdin,
            "entrypoint": entrypoint,
        })

        return res.data.stdout

    } catch (e) {
        console.log(e)
    }
}