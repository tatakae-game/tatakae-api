import { Router } from 'express'
const router = Router()
export default router

import Joi from '@hapi/joi'

import * as constants from '../constants'
import guard from '../middlewares/guard'
import schema, { SchemaError } from '../middlewares/schema'

import { ErrorsGenerator } from '../utils/errors'

import * as users from '../models/users'
import * as groups_permisions from '../models/groups'

const user_schema = Joi.object().keys({
  username: Joi.string().regex(users.username_regex).required(),
  email: Joi.string().email().required(),
  groups: Joi.array().items(Joi.string()).external(async groups => {
    for (const group of groups) {
      const is_in_db = await groups_permisions.model.exists({ _id: group })
      if (!is_in_db) {
        throw new SchemaError(`The group ${group} does not exist.`)
      }
    }
  }),
})

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
    if ((typeof username !== 'string') && (typeof username !== 'number')) {
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
    const user = await users.model.findById(req.params.id).populate('groups').lean()

    if (!user) {
      return res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
    }

    res.send({
      success: true,
      profile: users.sanitize(user),
    })
  } catch {
    res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
  }
})

router.put('/users/:id', guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_ADMIN] }), schema({ body: user_schema }), async (req, res) => {

  try {
    const { username, email, groups } = req.body || {}
    const user = await users.model.findById({ _id: req.params.id })
    let errors = []

    if (user) {
      if (email !== user.email) {
        const email_is_used = await users.model.exists({ email })
        if (email_is_used) {
          errors.push('This email is already used.')
        }
      }

      if (username !== user.username) {
        const username_is_used = await users.model.exists({ username })
        if (username_is_used) {
          errors.push('This username is already used.')
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          succsess: false,
          errors,
        })
      }

      await users.model.updateOne(
        { _id: req.params.id },
        {
          username,
          email,
          groups,
        }
      )

      res.status(200).json({
        success: true,
      })

    }
    else {
      res.status(400).json({
        success: false,
        error: ['The user does not exist.'],
      })
    }

  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured'],
    })
  }
})
