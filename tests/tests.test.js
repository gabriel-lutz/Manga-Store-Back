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

describe("GET /mangas:category", ()=>{
    it("should respond with status 200", async () => {
        const response = await supertest(app).get("/mangasall")
    
        expect(response.status).toEqual(200);
    });
})

describe("GET /cart", ()=>{
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
        await connection.query('DELETE FROM sessions')
        await connection.query('DELETE FROM carts')
    })
    it("should respond with status 200", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });
        const {token} = login.body

        const response = await supertest(app).get("/cart").set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toEqual(200);
    });
    it("should respond with status 401 when token is incorrect", async () => {
        
        const response = await supertest(app).get("/cart").set('Authorization', `Bearer token-incorreto`);
    
        expect(response.status).toEqual(401);
    });
    it("should respond with status 401 when token not found", async () => {
        
        const response = await supertest(app).get("/cart");
    
        expect(response.status).toEqual(401);
    });
})

describe("DELETE /cart:id", ()=>{
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
        await connection.query('DELETE FROM sessions')
        await connection.query('DELETE FROM carts')
    })
    it("should respond with status 200", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        const {user,token} = login.body
        await connection.query(`INSERT INTO carts ("userId", "mangaId","salesId") VALUES (${user.id},1,NULL)`)
        const response = await supertest(app).delete(`/cart${user.id}`).set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toEqual(200);
    });
    it("should respond with status 401 when token is incorrect", async () => {
        
        const response = await supertest(app).delete("/cart1").set('Authorization', `Bearer token-incorreto`);
    
        expect(response.status).toEqual(401);
    });
    it("should respond with status 401 when token not found", async () => {
        
        const response = await supertest(app).delete("/cart1");
    
        expect(response.status).toEqual(401);
    });
})

describe("POST /check-out", ()=>{
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
        await connection.query('DELETE FROM sessions')
        await connection.query('DELETE FROM carts')
        await connection.query('DELETE FROM sales')
    })
    it("should respond with status 200", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        const {user,token} = login.body
        await connection.query(`INSERT INTO carts ("userId", "mangaId","salesId") VALUES (${user.id},1,NULL)`)
        
        const checkoutData={
            deliverName: "test", 
            deliverPhoneNumber: "123456789", 
            deliverAddress: "test avenue", 
            creditCardNumber: "12345678912"
        }

        const response = await supertest(app).post(`/check-out`).send({checkoutData}).set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toEqual(200);
    });

    it("should respond with status 400 when not sending a correct body", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        const {user,token} = login.body
        await connection.query(`INSERT INTO carts ("userId", "mangaId","salesId") VALUES (${user.id},1,NULL)`)
        
        const checkoutData={
            data: "Messed_up_data"
        }

        const response = await supertest(app).post(`/check-out`).send({checkoutData}).set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toEqual(400);
    });

    it("should respond with status 401 when token is incorrect", async () => {
        const checkoutData={
            deliverName: "test", 
            deliverPhoneNumber: "123456789", 
            deliverAddress: "test avenue", 
            creditCardNumber: "12345678912"
        }
        
        const response = await supertest(app).post("/check-out").send({checkoutData}).set('Authorization', `Bearer token-incorreto`);
    
        expect(response.status).toEqual(401);
    });
    it("should respond with status 400 when token not found", async () => {
        
        const response = await supertest(app).post("/check-out");
        expect(response.status).toEqual(400);
    });
})

describe("GET /history", ()=>{
    beforeEach(async () =>{
        await connection.query('DELETE FROM users')
        await connection.query('DELETE FROM sessions')
        await connection.query('DELETE FROM carts')
        await connection.query('DELETE FROM sales')
    })
    it("should respond with status 200 when sending a valid token", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        const {user,token} = login.body
        
        const response = await supertest(app).get(`/history`).set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toEqual(200);
    });

    it("should respond with status 400 when not sending a token", async () => {
        const body = {
            name:"Test",
            email:"test@email.com.br",
            password:"123456"
        }
        await supertest(app).post("/sign-up").send(body);
        const login = await supertest(app).post("/sign-in").send({ email: body.email, password: body.password });

        const {user,token} = login.body

        const response = await supertest(app).get(`/history`)
    
        expect(response.status).toEqual(400);
    });

    it("should respond with status 401 when token is incorrect", async () => {
        const checkoutData={
            deliverName: "test", 
            deliverPhoneNumber: "123456789", 
            deliverAddress: "test avenue", 
            creditCardNumber: "12345678912"
        }
        
        const response = await supertest(app).get("/history").set('Authorization', `Bearer token-incorreto`);
    
        expect(response.status).toEqual(401);
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

afterAll(async () =>{
    await connection.query("DELETE FROM users WHERE email = 'test@email.com.br'")
    connection.end()

})