import express from 'express'
import 'dotenv/config';
import connectDB from './v1/config/db.config.js'
import cors from 'cors'

import v1Router from './v1/index.js';
import { notFoundMiddleware } from './v1/middlewares/NotFoundMiddleware.js';
import { errorMiddleware } from './v1/middlewares/ErrorMiddleware.js';

connectDB();

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))  

app.use(express.json())

app.use('/v1', v1Router)

app.use(notFoundMiddleware)
app.use(errorMiddleware)


export default app
