import cors from "cors"
import express from "express"
import bcrypt from "bcrypt"
import { v4 as uuidv4 } from 'uuid';

import connection from './database.js'

import {signUpSchema , signInSchema} from './schemas.js'

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

app.post("/sign-in", async (req,res)=>{
    const validation = signInSchema.validate(req.body)
    if(validation.error){
        res.sendStatus(400)
        return
    }
    try{
        const { email, password } = req.body;
        const result = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email])

        const user=result.rows[0]
        
        if(user && bcrypt.compareSync(password, user.password)){
            await connection.query(`
                DELETE FROM sessions
                WHERE "userId" = $1
            `,[user.id])

            const token = uuidv4()

            await connection.query(`
                INSERT INTO sessions 
                ("userId", token)
                VALUES ($1, $2)
            `, [user.id, token]);
            
            const {id,name,email} = user
            
            res.send({
                token,
                user:{
                    id,
                    name,
                    email
                }
            })
            return
        }
        res.sendStatus(401)
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.get("/cart", async (req,res)=>{
    try{
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');

        if(!token){
            res.sendStatus(401)
            return
        }
        const result = await connection.query(`
            SELECT *
            FROM sessions
            WHERE token = $1;
        `,[token])
        if(result.rows.length!==1){
            res.sendStatus(401)
            return
        }

        const {userId}= result.rows[0]
        const cart = await connection.query(`
            SELECT mangas.*, categories.name as "categoryName", carts.id as "cartId"
            FROM carts
            JOIN mangas
            ON mangas.id = carts."mangaId"
            JOIN categories
            ON mangas."categoryId"= categories.id
            WHERE carts."userId" = $1
        `,[userId])
        res.send(cart.rows)
        return
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.delete("/cart-remove:id", async (req,res)=>{
    try{
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');

        if(!token){
            res.sendStatus(401)
            return
        }
      
        const result = await connection.query(`
            SELECT *
            FROM sessions
            WHERE token = $1;
        `,[token])
        if(result.rows.length!==1){
            res.sendStatus(401)
            return
        }
    
        const cartId= req.params.id
        
        console.log(cartId)
        await connection.query(`
            DELETE FROM carts
            WHERE id = $1
        `,[cartId])
        res.sendStatus(200)
        return
    }catch(e){
        console.log(e)
        res.sendStatus(401)
    }
})

app.post("/logout", async (req,res)=>{
    try{
        const token = req.headers.authorization

        if(!token){
            return res.sendStatus(400)
        }
        const sessionQuery = await connection.query('SELECT * FROM sessions WHERE token = $1', [token])
        
        if(!sessionQuery.rows.length){
            return res.send(401)
        }

        await connection.query("DELETE FROM sessions WHERE token = $1", [token] )
        res.sendStatus(200)     

    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
})

export default app