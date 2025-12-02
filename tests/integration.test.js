const request = require("supertest");
const app = require("../index");
let token;
let userId;

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
});

describe("Integration Test for Users API", () => {

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
    expect(res.body.length).toBeGreaterThanOrEqual(1);
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
      .send({ firstname: "JohnUpdated", fullname: "John Doe", lastname: "Doe", username: "johndoe", status: "admin" });
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

});
