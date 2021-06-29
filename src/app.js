import cors from "cors"
import express from "express"
import connection from './database.js'

const app = express()
app.use(cors())
app.use(express.json());



export default app