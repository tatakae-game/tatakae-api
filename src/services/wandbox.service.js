import axios from 'axios'
import * as urls from '../constants/api-url'

const wandbox_url = urls.WANDBOX_URL

export async function execute_code(code) {
  try {
    const res = await axios.post(wandbox_url, {
      code,
      compiler: "nodejs-head",
    })

    if (res.data.signal === 'Killed') {
      return {error : "Signal Killed. Please check for infinite loop"}
    }

    if (!res.data.program_output) {
      return res.data
    }

    return JSON.parse(res.data.program_output)
  } catch (e) {
    console.log(e)
  }

}

export async function get_errors(code) {
  try {
    const res = await axios.post(wandbox_url, {
      code,
      compiler: "nodejs-head",
    })

    if (res.data.signal === 'Killed') {
      res.data.program_error = "Signal Killed. Please check for infinite loop"
    }

    return res.data.program_error
  } catch (e) {
    console.log(e)
  } 
}