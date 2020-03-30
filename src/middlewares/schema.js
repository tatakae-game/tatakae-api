import Joi from '@hapi/joi'

/**
 * @typedef SchemasOptions
 * @property {Joi.ObjectSchema<any>} body 
 * @property {Joi.ObjectSchema<any>} query 
 */

export class SchemaError extends Error { }

const schema_options = {
  abortEarly: false,
  stripUnknown: true,
}

/**
 * @param {SchemasOptions} options 
 * @returns {import('express').RequestHandler} 
 */
export default (options) => async (req, res, next) => {
  try {
    if (options.body) {
      req.body = await options.body.options(schema_options).validateAsync(req.body)
    }

    if (options.query) {
      req.query = await options.query.options(schema_options).validateAsync(req.query)
    }

    next()
  } catch (e) {
    if ('details' in e) {
      return res.status(400).json({
        success: false,
        errors: e.details.map(d => d.message),
      })
    }

    res.status(500).json({
      success: false,
      errors: [(e instanceof SchemaError) ? e.message : 'An error occured while validating the request.'],
    })
  }
}
