import { Router } from 'express'
const router = Router()
export default router

import db from '../db'

import * as constants from '../constants'
import guard from '../middlewares/guard'

import { ErrorsGenerator } from '../utils/errors'

import * as users from '../models/users'
import * as rooms from '../models/rooms'

router.get('/chat/rooms', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const user = await users.find_by_token(req.token)

    const result = await rooms.model.find({
      users: user._id,
      is_ticket: false,
    })

    res.send({
      success: true,
      rooms: result.map(rooms.sanitize),
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        erorrs: ['An error occured.'],
      })
  }
})

router.get('/chat/rooms/:room_id', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const room = await rooms.model.findById(req.params.room_id).lean()

    res.send({
      success: true,
      room: rooms.sanitize(room)
    })
  } catch {
    res.status(404)
      .send(ErrorsGenerator.gen([`This room does not exist.`]))
  }
})

router.post('/chat/rooms/:room_id/invite', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const errors = new ErrorsGenerator()
    if (!db.Types.ObjectId.isValid(req.body.user)) {
      return res.send(ErrorsGenerator.gen(["Invalid user id."]))
    }

    const user_exists = await users.model.exists({ _id: req.body.user })

    if (!user_exists) {
      return res.send(ErrorsGenerator.gen("This user doesn't exists"))
    }

    await rooms.model.updateOne({
      _id: req.params.room_id,
    }, {
      $push: {
        users: req.body.user,
      },
    })

    res.send({
      success: true,
    })
  } catch {
    res.status(404)
      .send(ErrorsGenerator.gen([`This room does not exist.`]))
  }
})

router.post('/chat/rooms', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const { name, is_ticket = false, guest } = req.body || {}
    const errors = new ErrorsGenerator()
    const people = []

    errors.assert(typeof name === 'string', 'Invalid name.')
    errors.assert(typeof is_ticket === 'boolean', 'is_ticket must be a boolean.')

    if (errors.has_errors) {
      return res.send(errors.gen())
    }

    const user = await users.find_by_token(req.token)
    const guest_exists = (guest) ? await users.model.exists({ _id: guest }) : false

    if (user === null || (!guest_exists && !is_ticket)) {
      return res.send(ErrorsGenerator.gen([`User not found.`]))
    }

    (guest_exists) ? people.push(user.id, guest) : people.push(user.id)

    const room = await rooms.model.create({
      name,
      author: user._id,
      users: people,
      is_ticket,
    })

    res.send({
      success: true,
      room: rooms.sanitize(room),
    })
  } catch {
    res.status(500).json({
      success: false,
      errors: ['An error occured.'],
    })
  }

})
