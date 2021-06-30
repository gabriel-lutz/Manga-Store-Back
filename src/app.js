import cors from "cors"
import express from "express"
import bcrypt from "bcrypt"

import connection from './database.js'

import signUpSchema from './schemas.js'

const app = express()
app.use(cors())
app.use(express.json());

app.get('/allmangas', async (req,res)=>{
    try{
        const query = await connection.query(`
        SELECT mangas.*, categories.name AS "categoryName" 
        FROM mangas
        JOIN categories 
        ON categories.id = mangas."categoryId"
        `)
        res.send(query.rows).status(200)
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
})
app.post("/sign-up", async (req,res) =>{
    const validation = signUpSchema.validate(req.body)
    
    if(validation.error){
        res.sendStatus(400)
        return
    }
    try{
        const { name, email, password } = req.body;
        
        const emailRegistered = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email])

        if(emailRegistered.rows.length>0){
            res.sendStatus(409)
            return
        }

        const hash = bcrypt.hashSync(password,12)

        await connection.query(`
            INSERT INTO users
            (name, email, password)
            VALUES ($1, $2, $3)
        `,[name, email, hash])

        res.sendStatus(201)
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
})

export default app