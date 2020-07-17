import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import * as games from '../models/game'
import { isBoolean } from 'lodash'

router.get('/games', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const result = await games.model.find({ active: true })

    res.send({
      success: true,
      games: result.map(games.simplify),
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.get('/games/disabled', guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_GAME] }), async (req, res) => {
  try {

    const result = await games.model.find({ active: false })

    res.send({
      success: true,
      games: result.map(games.simplify),
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.get('/games/user/:id', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const user_id = req.params.id
    const result = await games.model.find({ participants: user_id, active: true })

    res.send({
      success: true,
      games: result.map(games.simplify),
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.get('/games/:id/winrate', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const id = req.params.id
    const result = await games.get_win_rate(id)

    res.send({
      success: true,
      win_rate: result,
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.put('/games/status', guard({ auth: constants.AUTH, permissions: [constants.PERMISSION_GAME] }), async (req, res) => {
  try {
    const { id, status } = req.body || {}

    const result = await games.model.findById(id)

    if (!isBoolean(status)) {
      return res.status(405)
        .json({
          success: false,
          errors: ['status need to be a boolean']
        })
    }

    result.active = status
    result.save()

    res.send({
      success: true,
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})

router.get('/games/:id', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const id = req.params.id
    const result = await games.model.find({ _id: id, active: true })

    res.send({
      success: true,
      games: result[0],
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})
