import { Router } from 'express'
const router = Router()
export default router

import * as constants from '../constants'
import guard from '../middlewares/guard'

import { ErrorsGenerator } from '../utils/errors'

import * as groups from '../models/groups'

router.post('/groups', guard({ auth: constants.AUTH }), async (req, res, next) => {
  const { name, permissions } = req.body || {}

  const errors = new ErrorsGenerator()

  errors.assert(typeof name === 'string', 'Invalid name')
  errors.assert(typeof permissions === 'object', 'Invalid permissions')

  if (errors.has_errors()) {
    return res.status(400).send({
      errors: errors.messages
    })
  }

  const group = groups.model.create({
    name,
    permissions
  })

  res.status(201).send({
    success: true,
    group,
  })

})

// router.put('/groups/:group_id', guard({ auth: constants.AUTH }), async (req, res, next) => {
//   const { name, permissions } = req.body || {}

//   const errors = new ErrorsGenerator()

//   errors.assert(typeof name === 'string', 'Invalid name')
//   errors.assert(typeof permissions === 'object', 'Invalid permissions')
//   errors.assert(groups.model.exists({ _id: req.params.group_id }), 'The group does not exist')


//   if (errors.has_errors()) {
//     return res.status(400).send({
//       errors: errors.messages
//     })
//   }

//   const group = groups.model.updateOne(
//     { _id: req.params.group_id },
//     {
//       permissions
//     }
//   )

// })
