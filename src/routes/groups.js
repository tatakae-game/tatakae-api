import { Router } from 'express'
const router = Router()
export default router

import Joi from '@hapi/joi'

import * as constants from '../constants'
import guard from '../middlewares/guard'
import schema from '../middlewares/schema'

import * as groups from '../models/groups'

router.get('/groups', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const result = await groups.model.find()

    const merged_groups = groups.fill_groups_permissions(result)

    res.json({
      success: true,
      groups: merged_groups,
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      errors: [e.message],
    })
  }
})

router.get('/groups/:group_id', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const group = await groups.model.findById({ _id: req.params.group_id })

    res.json({
      success: true,
      group,
    })
  } catch {
    res.status(404).json({
      success: false,
      errors: ['The group does not exist.'],
    })
  }
})

const groups_post_schema = Joi.object().keys({
  name: Joi.string().alphanum().required(),
})

router.post('/groups', guard({ auth: constants.AUTH }), schema({ body: groups_post_schema }), async (req, res) => {
  try {

    const permissions = groups.get_default_permissions();

    const { name } = req.body

    const group = await groups.model.create({
      name,
      permissions,
    })

    res.status(201).send({
      success: true,
      group,
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      errors: ['Failed to create the new group.'],
    })
  }
})

const groups_put_schema = Joi.object().keys({
  name: Joi.string().alphanum().required(),
  permissions: Joi.array()
})

router.put('/groups/:group_id', guard({ auth: constants.AUTH }), schema({ body: groups_put_schema }), async (req, res) => {
  try {
    const { name, permissions } = req.body

    await groups.model.updateOne(
      { _id: req.params.group_id },
      {
        name,
        permissions,
      }
    )

    res.json({
      success: true,
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      errors: ['Failed to update the group.'],
    })
  }
})

router.get('/permissions', guard({ auth: constants.AUTH }), async (req, res) => {
  try {
    const permissions = groups.get_default_permissions()
    res.json({
      success: true,
      permissions,
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message],
    })
  }
})
