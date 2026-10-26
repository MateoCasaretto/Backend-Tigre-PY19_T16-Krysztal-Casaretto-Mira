import express from 'express'

//import v1Router from './v1/index.js';

const app = express()

app.use(express.json())
//app.use('/v1', v1Router)


export default app