import { Router } from 'express'
const router = Router()
export default router

import Joi from '@hapi/joi'

import * as constants from '../constants'
import guard from '../middlewares/guard'
import schema, { SchemaError } from '../middlewares/schema'
import game_classes from '../game/game-classes'

import { ErrorsGenerator } from '../utils/errors'

import * as users from '../models/users'
import * as groups_permisions from '../models/groups'
import { check_include_errors, resolve_files, try_code } from '../services/code.service'
import { JsRunner } from '../game/js-runner'
import { generate_field } from '../services/game.service'
import { SanRunner } from '../game/san-runner'
import { verify, hash } from '../utils/hash'

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
  password: Joi.string().email().required(),
})

router.get('/users/me', guard({ auth: constants.AUTH }), async (req, res) => {
  const user = await users.sanitize(await users.find_by_token(req.token))

  res.send({
    success: true,
    profile: user,
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

router.get('/users/admins',
  guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_DASHBOARD] }),
  async (req, res) => {
    try {
      const admins = (await users.model.find().populate('groups'))
        .reduce((arr, admin) => {
          const is_admin = admin?.groups.reduce((acc, group) => {
            for (const permission of group.permissions) {
              if (permission.name === constants.PERMISSION_DASHBOARD && permission.value) {
                acc = true
              }
            }
            return acc
          }, false)
          if (is_admin) { arr.push(admin) }
          return arr
        }, [])

      res.json({ success: true, users: admins })

    } catch (e) {
      res.status(500).json({ success: false, errors: [e.message] })
    }
  })

router.get('/users/code/js', guard({ auth: constants.AUTH }), async (req, res) => {
  try {

    const user = await users.find_by_token(req.token)

    if (!user) {
      return res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
    }

    res.send({
      success: true,
      code: user.js_code,
    })
  } catch {
    res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
  }
})

router.get('/users/code/san', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const user = await users.find_by_token(req.token)

    if (!user) {
      return res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
    }

    res.send({
      success: true,
      code: user.san_code,
    })
  } catch {
    res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
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
      profile: await users.sanitize(user),
    })
  } catch {
    res.status(404).send(ErrorsGenerator.gen([`This user doesn't exist.`]))
  }
})

router.put('/users/:id/code', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const { files, language } = req.body || {}

    const user = await users.model.findById(req.params.id)
    if (!user) {
      res.status(400).json({
        success: false,
        errors: ['The user does not exist.'],
      })
    }

    if (language === 'js') {
      const include_errors = check_include_errors(files)
      if (include_errors.length !== 0) {
        return res.send({
          success: "false",
          errors: include_errors,
        })
      }
    }

    let runner
    const map = new game_classes.Map(generate_field())

    if (language === 'js') {
      runner = new JsRunner({ js_code: files }, map)
    } else if (language === 'san') {
      runner = new SanRunner()
    }

    if (runner === undefined) {
      return res.send({
        success: "false",
        errors: ["Selected language not supported"],
      })
    }

    const errors = await runner.test()
    if (errors) {
      return res.send({
        success: "false",
        errors: [errors],
      })
    }

    user[`${language}_code`] = files
    user.save()
    return res.send({
      success: "true",
      errors: ['Code successfuly saved']
    })

  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured'],
    })
  }
})

router.put('/user/password', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const { password, new_password } = req.body || {}
    console.log(password, new_password)

    if (!password || !new_password) {
      return res.status(400).json({
        success: false,
        errors: ['Please, provide password and new_password'],
      })
    }

    const user = await users.find_by_token(req.token)
    console.log(user)

    if (!user) {
      return res.status(400).json({
        success: false,
        errors: ["User doesn't exist"],
      })
    }
    const valid = await verify(user.password, password)

    if (!valid) {
      return res.status(400).json({
        success: false,
        errors: ['Password is not valid'],
      })
    }

    user.password = hash(new_password)
    user.save()

    return res.status(200).json({
      success: true,
    })

  } catch (e) {
    return res.status(500).json({
      success: false,
      errors: [e],
    })
  }
})

router.put('/user/language', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const { language } = req.body || {}
    console.log(language)
    const user = await users.find_by_token(req.token)

    if (!language) {
      return res.status(400).json({
        success: false,
        errors: ['Please, provide a language'],
      })
    }

    if (language === 'js' || language === 'san') {

      user.running_language = language
      user.save()

      return res.status(200).json({
        success: true,
        running_language: language,
      })
    } else {
      return res.status(400).json({
        success: false,
        errors: ['Please provide a valid language']
      })
    }


  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured'],
    })
  }
})

router.put('/users/:id', guard({ auth: constants.AUTH }), schema({ body: user_schema }), async (req, res) => {

  try {
    const { username, email, groups, password } = req.body || {}
    const user = await users.model.findById({ _id: req.params.id })

    if (password !== user.password) {
      return res.status(400).json({
        success: false,
        errors: ['password is invalid'],
      })
    }

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
          success: false,
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

