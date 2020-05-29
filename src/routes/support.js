import { Router } from 'express'
const router = Router()
export default router

import Joi from '@hapi/joi'

import * as constants from '../constants'
import guard from '../middlewares/guard'
import schema from '../middlewares/schema'

import * as users from '../models/users'
import * as rooms from '../models/rooms'


router.get('/support/user/tickets', guard({ auth: constants.AUTH }), async (req, res) => {
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

router.get('/support/tickets', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const result = await rooms.model.find({ is_ticket: true, }).populate('users', 'messages')

    res.send({
      success: true,
      rooms: result,
    })
  } catch {
    res.status(500).json({ success: false, errors: ['An error occured.'], })
  }
})

router.get('/support/admin/tickets/opened',
  guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_DASHBOARD] }),
  async (req, res) => {
    try {
      const result = await rooms.model.find({
        is_ticket: true,
        status: { $in: ['opened', 'in progress'] },
      }).populate('users', 'messages')

      res.json({ success: true, tickets: result})

    } catch (e) {
      res.status(500).json({
        success: false,
        errors: [e.message],
      })
    }
  })

router.get('/support/admin/tickets/closed',
  guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_DASHBOARD] }),
  async (req, res) => {
    try {
      const result = await rooms.model.find({
        is_ticket: true,
        status: 'closed',
      }).populate('users', 'messages')

      res.json({ success: true, tickets: result})

    } catch (e) {
      res.status(500).json({
        success: false,
        errors: [e.message],
      })
    }
  })

const statusSchema = Joi.object().keys({
  status: Joi.string().min(6).required()
})

router.put(`/support/tickets/:id/status`,
  guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_DASHBOARD] }),
  schema({ body: statusSchema }),
  async (req, res) => {
  try {
    const { status } = req.body
    if (await rooms.model.exists({ _id: req.params.id })) {
      await rooms.model.updateOne({ _id: req.params.id }, { status, })
      res.json({ success: true, })

    } else {
      res.status(404).json({ success: false, errors: ["The ressource does not exist."], })
    }

  } catch (e) {
    res.status(500).json({ success: false, errors: [e.message], })
  }
})

const assigned_to_schema = Joi.object().keys({
  user: Joi.string().alphanum().min(24).max(24).required(),
})

router.put(`/support/tickets/:id/assign`,
  guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_DASHBOARD] }),
  schema({ body: assigned_to_schema }), async (req, res) => {
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

    const authorized = permissions?.includes(constants.PERMISSION_DASHBOARD)

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
