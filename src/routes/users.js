import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import * as users from '../models/users'

router.get('/users/me', guard({ auth: constants.AUTH }), async (req, res) => {
  const user = await users.find_by_token(req.token)

  res.send({
    success: true,
    profile: {
      username: user.username,
      email: user.email,
      registred: user.created,
    },
  })
})
