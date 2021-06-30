import supertest from "supertest"
import app from "../src/app.js"
import connection from "../src/database.js";

describe("POST /sign-up", () => {
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
    })
    it("should respond with status 201 when there is no user with given email", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }

        const result = await supertest(app).post("/sign-up").send(body)

        expect(result.status).toEqual(201);
    });
    it("should respond with status 409 when there already is an user with given email", async ()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }

        await connection.query(`
            INSERT INTO users 
            (name, email, password) 
            VALUES ($1, $2, $3)
        `, [body.name, body.email, body.password]);

        const response = await supertest(app).post("/sign-up").send(body);

        expect(response.status).toEqual(409);
    })
}); 

afterAll(() =>{
    connection.end()
})