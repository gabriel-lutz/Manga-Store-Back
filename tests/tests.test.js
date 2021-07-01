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

describe("POST /sign-in", ()=>{
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
        await connection.query('DELETE FROM sessions')
    })
    it("should respond with status 200 when user exists and password is valid", async()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                token: expect.any(String)
            })
        );
    })
    it("should respond with status 401 when user exists but password is invalid", async () => {
        const body = {
          name: "Test",
          email: "test@email.com",
          password: "123456"
        };
    
        await supertest(app).post("/sign-up").send(body);
    
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: "senha_incorreta" });
    
        expect(response.status).toEqual(401);
    });
    
    it("should respond with status 401 when user doesn't exist", async () => {
        const body = {
          name: "Test",
          email: "test@email.com",
          password: "123456"
        };
    
        await supertest(app).post("/sign-up").send(body);
    
        const response = await supertest(app).post("/sign-in").send({ 
            email: "email_nao_cadastrado@email.com", 
            password: "senha_incorreta" 
        });
    
        expect(response.status).toEqual(401);
    });
})

describe("POST /logout", ()=>{
    let token;
    beforeAll(async ()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });
        token = response.body.token
    })
    it("should respond with status 200 when user send a valid token", async () => {
    
        const response = await supertest(app).post("/logout").send({}).set({Authorization: token});
    
        expect(response.status).toEqual(200);
    });
    it("should respond with status 400 when user does not send a token", async () => {
        
        const response = await supertest(app).post("/logout").send({})
    
        expect(response.status).toEqual(400);
    });
    it("should respond with status 401 when user send a invalid token", async () => {
        
        const response = await supertest(app).post("/logout").send({}).set({Authorization: "token"});
    
        expect(response.status).toEqual(401);
    });
})

describe("GET /allmangas", ()=>{
    it("should respond with status 200", async () => {
        const response = await supertest(app).get("/allmangas")
    
        expect(response.status).toEqual(200);
    });
})

describe("POST /addproduct/:productId", ()=>{
    let token;
    beforeAll(async ()=>{
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const response = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });
        token = response.body.token
    })


    it("should respond with status 200 when user has a valid token and the product is added to cart", async () => {
        const response = await supertest(app).post("/addproduct/1").set({Authorization: token});
        expect(response.status).toEqual(200);
    });

    it("should respond with status 400 when user doesnt send a token", async () => {
        const response = await supertest(app).post("/addproduct/1")
        expect(response.status).toEqual(400);
    });

    it("should respond with status 401 when user doesnt have a valid token", async () => {
        const response = await supertest(app).post("/addproduct/1").set({Authorization: "token"});
        expect(response.status).toEqual(401);
    });
})

afterAll(() =>{
    connection.query("DELETE FROM users WHERE email = test@email.com.br")
    connection.end()

})