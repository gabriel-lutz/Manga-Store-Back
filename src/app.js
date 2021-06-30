import cors from "cors"
import express from "express"
import connection from './database.js'

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


export default app