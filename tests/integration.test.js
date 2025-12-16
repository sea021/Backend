const request = require("supertest");
const app = require("../index");
let token;
let userId;
let aliceId;

beforeAll(async () => {
  // สร้าง user ใหม่
  const res = await request(app).post('/users').send({
    firstname: "John",
    fullname: "John Doe",
    lastname: "Doe",
    username: "johndoe",
    password: "123456"
  });
  userId = res.body.id;

  // Login เพื่อรับ token
  const login = await request(app).post('/login').send({
    username: "johndoe",
    password: "123456"
  });
  token = login.body.token;

  // สร้าง user อีกคนสำหรับทดสอบ search และ update password
  const alice = await request(app).post('/users').send({
    firstname: "Alice",
    fullname: "Alice Smith",
    lastname: "Smith",
    username: "alice123",
    password: "alicepass"
  });
  aliceId = alice.body.id;
});

describe("Integration Test for Users API", () => {

  // ---------------------- Test เดิม ----------------------
  test("GET /ping", async () => {
    const res = await request(app).get("/ping");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  test("GET /profile", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("johndoe");
  });

  test("GET /users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("GET /users/:id", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(userId);
  });

  test("PUT /users/:id", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ 
        firstname: "JohnUpdated", 
        fullname: "John Doe", 
        lastname: "Doe", 
        username: "johndoe", 
        status: "admin" 
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User updated successfully");
  });

  test("DELETE /users/:id", async () => {
    const res = await request(app)
      .delete(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  // ---------------------- เพิ่มอีก 4 tests ----------------------

  test("POST /users - create new user", async () => {
    const res = await request(app).post('/users').send({
      firstname: "Bob",
      fullname: "Bob Johnson",
      lastname: "Johnson",
      username: "bob123",
      password: "bobpass"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  test("POST /login - login user", async () => {
    const res = await request(app).post('/login').send({
      username: "alice123",
      password: "alicepass"
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("GET /users?search=Alice - search user", async () => {
    const res = await request(app)
      .get("/users?search=Alice")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.some(u => u.username === "alice123")).toBe(true);
  });

  test("PUT /users/:id - update password for Alice", async () => {
    const res = await request(app)
      .put(`/users/${aliceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "newalicepass" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User updated successfully");
  });

});
