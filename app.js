import express from 'express'

import connectDB from './v1/config/db.config.js'

//import v1Router from './v1/index.js';

connectDB();

const app = express()

app.use(express.json())

//app.use('/v1', v1Router)


export default app