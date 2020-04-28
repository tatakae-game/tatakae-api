import axios from 'axios'
import * as urls from '../constants/api-url'

const wandbox_url = urls.WANDBOX_URL

export async function execute_code(code) {
  try {
    const res = await axios.post(wandbox_url, {
      code,
      compiler: "nodejs-head",
    })

    if (!res.data.program_output) {
      return res.data
    }

    return JSON.parse(res.data.program_output).actions
  } catch (e) {
    console.log(e)
  }

}
