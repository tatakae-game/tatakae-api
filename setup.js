import db from './src/db'

import * as groups from './src/models/groups'
import * as constants from './src/constants'

/**
 * @param {db.Model<db.Document, {}>} model 
 * @param {any} search 
 * @param {any} doc 
 */
async function find_or_create(model, search, doc) {
  let exists = false

  try {
    const data = await model.findOne(search)

    if (data) {
      exists = true
    }
  } catch { }

  if (!exists) {
    return await model.create(doc)
  }

  return null
}

void async function () {
  try {
    await find_or_create(groups.model,
      {
        name: 'Players',
      },
      {
        name: 'Players',
        permissions: [
          {
            name: constants.PERMISSION_EDITOR,
            value: true,
          },
          {
            name: constants.PERMISSION_CHAT,
            value: true,
          },
        ],
      })

    db.disconnect()
  } catch (e) {
    console.error(e)
  }
}()
