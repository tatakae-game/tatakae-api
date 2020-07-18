import axios from 'axios'
import * as urls from '../constants/api-url'

const playground_url = urls.PLAYGROUND_URL

export async function execute_code(files, entrypoint, stdin) {
    console.log("in exec")
    console.log(entrypoint)
    console.log(stdin)
  try {
    const res = await axios.post(`${playground_url}/run`, {
      files,
      stdin,
      entrypoint
    })

    // console.log(res)

    return res

  } catch (e) {
    // console.log(e)
  }

}

export async function build(files, stdin, entrypoint) {
  try {
    const res = await axios.post(`${playground_url}/build`, {
        files,
        stdin,
        entrypoint,
    })

    return res
} catch (e) {
    console.log(e)
  } 
}