import { Router } from 'express'
const router = Router()
export default router

import Joi from '@hapi/joi'

import * as constants from '../constants'
import guard from '../middlewares/guard'
import schema from '../middlewares/schema'

import * as users from '../models/users'
import * as rooms from '../models/rooms'


router.get('/support/tickets', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const user = await users.find_by_token(req.token)

    const result = await rooms.model.find({
      users: user._id,
      is_ticket: true,
      status: { $in: ['opened', 'in progress'] },
    })

    res.send({
      success: true,
      rooms: result.map(rooms.sanitize),
    })
  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.put(`/support/tickets/:id/close`, guard({ auth: constants.AUTH }), async (req, res) => {
  try {

    await rooms.model.updateOne(
      { _id: req.params.id },
      { status: 'closed', }
    )

    res.json({
      success: true,
    })

  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured.'],
    })

  }
})

const assigned_to_schema = Joi.object().keys({
  user: Joi.string().alphanum().min(24).max(24).required(),
})

router.put(`/support/tickets/:id/assign`, guard({ auth: constants.AUTH, permissions: [constants.ADMIN]}), schema({ body: assigned_to_schema }), async (req, res) => {
  try {
    const { user } = req.body || {}

    const admin = await users.model.findById({ _id: user }).populate('groups')

    const permissions = admin?.groups.reduce((acc, group) => {
      for (const permission of group.permissions) {
        if (permission.value) {
          acc.push(permission.name)
        }
      }
      return acc
    }, [])

    const authorized = permissions?.includes(constants.ADMIN)

    if (!authorized) {
      return res.status(400).json({
        success: false,
        errors: ['User not authorized to manage tickets.'],
      })
    }
    await rooms.model.updateOne(
      { _id: req.params.id },
      { assigned_to: user },
    )

    res.json({
      success: true,
    })

  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured.'],
    })
  }
})
