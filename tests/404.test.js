process.env.NODE_ENV = 'test';
process.env.PORT = 0;
const request = require('supertest');
const { app, server } = require('../server/app');

afterAll(() => {
  server.close();
});

describe('GET unknown route', () => {
  it('returns custom 404 page', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404');
  });
});
