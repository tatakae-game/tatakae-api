import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import * as users from '../models/users'
import * as rooms from '../models/rooms'


router.get('/support/rooms', guard({ auth: constants.AUTH }), async (req, res) => {
    const user = await users.find_by_token(req.token)
  
    const result = await rooms.model.find({ users: user._id , is_ticket: true, })
  
    res.send({
      success: true,
      rooms: result.map(rooms.sanitize),
    })
  })