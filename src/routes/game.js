import { Router } from 'express'
const router = Router()
export default router

import db from '../db'

import * as constants from '../constants'
import guard from '../middlewares/guard'

import * as users from '../models/users'
import * as games from '../models/game'

router.get('/games', async (req, res) => {
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

router.get('/games/disabled', async (req, res) => {
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

router.get('/games/user/:id', async (req, res) => {
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

router.get('/games/:id/winrate', async (req, res) => {
  console.log("coucou")
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

router.get('/games/:id', async (req, res) => {
  try {
    const id = req.params.id
    const result = await games.model.find({ _id: id, active: true })

    res.send({
      success: true,
      games: result,
    })

  } catch {
    res.status(500)
      .json({
        success: false,
        errors: ['An error occured.'],
      })
  }
})