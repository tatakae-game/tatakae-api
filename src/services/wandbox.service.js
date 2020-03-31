import axios from 'axios'
import * as urls from '../constants/api-url'

const wandbox_url = urls.WANDBOX_URL

export async function execute_code(code, args) {
  try {
    const res = await axios.post(wandbox_url, {
        code,
        compiler: "nodejs-head",
        ...args,
      }
    )

    console.log(res)

  } catch (e) {
    console.log(e)
  }

}