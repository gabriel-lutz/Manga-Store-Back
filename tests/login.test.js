import supertest from "supertest"
import app from "../src/app.js"
import connection from "../src/database.js";


beforeEach(async () =>{
    await connection.query('DELETE FROM users')
})

afterAll(() =>{
    connection.end()
})