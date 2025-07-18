process.env.NODE_ENV = 'test';
process.env.PORT = 0;
const request = require('supertest');
const { app, server } = require('../server/app');
const users = require('../data/users.json');

afterAll(() => {
  server.close();
});

describe('POST /api/login', () => {
  it('logs in a valid user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ name: users[0] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
