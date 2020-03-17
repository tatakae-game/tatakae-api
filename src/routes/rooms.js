import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import { ErrorsGenerator } from '../utils/errors'

import * as users from '../models/users'
import * as rooms from '../models/rooms'

router.get('/chat/rooms', guard({ auth: constants.AUTH }), async (req, res) => {
  const user = await users.find_by_token(req.token)

  const result = await rooms.model.find({ users: user._id })

  res.send({
    success: true,
    rooms: result.map(rooms.sanitize),
  })
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

router.post('/chat/room', guard({ auth: constants.AUTH }), async (req, res) => {
  const { name, is_ticket } = req.body || {}
  const errors = new ErrorsGenerator()

  errors.assert(typeof name === 'string', 'Invalid name.')
  errors.assert(typeof is_ticket === 'boolean', 'is_ticket must be a boolean.')

  if (errors.has_errors) {
    res.send(ErrorsGenerator.gen([`This room does not exist.`]))
  }

  const user = await users.find_by_token(req.token)

  const room = await rooms.model.create({
    name,
    author: user._id,
    users: [user._id],
    is_ticket: req.body.is_ticket,
  })

  res.send({
    success: true,
    room: rooms.sanitize(room),
  })
})
