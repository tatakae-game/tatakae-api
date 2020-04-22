import axios from 'axios'
import * as urls from '../constants/api-url'

const wandbox_url = urls.WANDBOX_URL

export async function execute_code(code) {
  try {
    const res = await axios.post(wandbox_url, {
      code,
      compiler: "nodejs-head",
    })

    if (res.data.program_error) {
      return res.data.program_error
    }

    return JSON.parse(res.data.program_output)
  } catch (e) {
    console.log(e)
  }

}
