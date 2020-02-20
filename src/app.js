import express from 'express'
const app = express()

app.set('trust proxy', true)

import helmet from 'helmet'
app.use(helmet())

import body_parser from 'body-parser'
app.use(body_parser.urlencoded({ extended: false }))
app.use(body_parser.json())

import token_middleware from './middlewares/token'
app.use(token_middleware)

import auth_middleware from './middlewares/auth'
app.use(auth_middleware)

import cors from 'cors'
app.use(cors())

import * as routes from './routes'
app.use(Object.values(routes))

import { ErrorsGenerator } from './utils/errors'
app.use('*', (req, res) => {
  res.status(404).send(ErrorsGenerator.gen(['Not Found']))
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Running on http://localhost:${port}`))
