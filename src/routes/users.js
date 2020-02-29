import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import { ErrorsGenerator } from '../utils/errors'

import * as users from '../models/users'

router.get('/users/me', guard({ auth: constants.AUTH }), async (req, res) => {
  const user = await users.find_by_token(req.token)

  res.send({
    success: true,
    profile: users.sanitize(user),
  })
})

router.get('/users/search', guard({ auth: constants.AUTH }), async (req, res) => {
  const { username } = req.query

  if (username) {
    if ((typeof username != 'string') || (typeof username != 'number')) {
      return res.send(ErrorsGenerator.gen(['"username" parameter must be a string.']))
    }

    try {
      const found = await users.model.find({
        username: { $regex: `.*${username}.*` },
      }).limit(10).lean()

      res.send({
        success: true,
        users: found.map(users.sanitize),
      })
    } catch {
      res.send({
        success: true,
        users: [],
      })
    }
  } else {
    res.send(ErrorsGenerator.gen(['"username" parameter requiered.']))
  }
})

router.get('/users/:id', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const user = await users.model.findById(req.params.id).lean()

    res.send({
      success: true,
      profile: users.sanitize(user),
    })
  } catch {
    res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
  }
})
