import cluster from 'cluster'
import os from 'os'

import express from 'express'
import body_parser from 'body-parser'
import helmet from 'helmet'
import cors from 'cors'

import token_middleware from './middlewares/token'
import auth_middleware from './middlewares/auth'

import * as routes from './routes'

import { ErrorsGenerator } from './utils/errors'

const cpus = os.cpus().length

if (cluster.isMaster) {
  for (let i = 0; i < cpus; i++) {
    cluster.fork()
  }

  cluster.on('online', (worker) => {
    console.log(`${worker.process.pid.toString().padStart(5, ' ')} is starting`)
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} terminated.`)
  })
} else {
  const app = express()
  app.set('trust proxy', true)

  app.use(helmet())

  app.use(body_parser.urlencoded({ extended: false }))
  app.use(body_parser.json())

  app.use(token_middleware)
  app.use(auth_middleware)

  app.use(cors())

  app.use(Object.values(routes))

  app.use('*', (req, res) => {
    res.status(404).send(ErrorsGenerator.gen(['Not Found']))
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`${process.pid.toString().padStart(5, ' ')} started running on http://localhost:${port}`))
}
