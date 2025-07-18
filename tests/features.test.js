process.env.NODE_ENV = 'test';
process.env.PORT = 0;
const request = require('supertest');
const { app, server } = require('../server/app');

afterAll(() => {
  server.close();
});

describe('GET /api/features', () => {
  it('returns list of features', async () => {
    const res = await request(app).get('/api/features');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(10);
  });
});
