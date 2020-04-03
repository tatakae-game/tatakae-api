import { Router } from 'express'
const router = Router()
export default router

import { ErrorsGenerator } from '../utils/errors'
import * as hash from '../utils/hash'

import * as constants from '../constants'
import guard from '../middlewares/guard'

import * as users from '../models/users'
import * as groups from '../models/groups'
import * as tokens from '../models/tokens'

router.post('/auth/check', (req, res) => {
  res.send({
    valid: req.authed,
  })
})

router.post('/auth/register', guard({ auth: constants.NOT_AUTH }), async (req, res, next) => {
  const { username, email, password } = req.body || {}
  const errors = new ErrorsGenerator()

  errors.assert(typeof username === 'string', "Invalid username.")
  errors.assert(typeof email === 'string', "Invalid email.")
  errors.assert(typeof password === 'string', "The password does not match the conditions.")

  if (!errors.has_errors) {
    if (users.username_regex.test(username)) {
      const exists = await users.model.exists({ username })
      errors.assert(!exists, "This username is already used.")
    } else {
      errors.push("The username does not match the conditions.")
    }

    if (users.email_regex.test(email)) {
      const exists = await users.model.exists({ email })
      errors.assert(!exists, "This email is already used.")
    } else {
      errors.push("The email is not valid.")
    }

    errors.assert(users.password_regex.test(password), "The password does not match the conditions.")
  }

  if (errors.has_errors) {
    return res.send({
      errors: errors.messages,
    })
  }

  const player_group = await groups.model.findOne({
    name: 'Players',
  })

  await users.model.create({
    username,
    email,
    groups: [player_group._id],
    password: await hash.hash(password),
  })

  res.send({
    success: true,
  })
})


router.post('/auth/login', guard({ auth: constants.NOT_AUTH }), async (req, res, next) => {
  const { username, password, keep_connected } = req.body || {}

  if (typeof username === 'string' && typeof password === 'string') {
    let username_is_email = false

    if (users.email_regex.test(username)) {
      username_is_email = true
    }

    if (users.password_regex.test(password)) {
      try {
        const user = await users.model.findOne({
          [username_is_email ? "email" : "username"]: username,
        })

        const valid = await hash.verify(user.password, password)

        if (valid) {
          const token = await tokens.create(user._id, !!keep_connected)

          return res.send({
            success: true,
            token: token.value,
            user: {
              id: user.id,
              username: user.username,
            },
          })
        }
      } catch { }
    }
  }

  res.send(ErrorsGenerator.gen(['Credentials do not match.']))
})
