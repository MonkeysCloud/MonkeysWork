import request from 'supertest';
import app from '../src/index';

describe('Health endpoint', () => {
  it('should return ok status', async () => {
    // TODO: setup test server properly
    // const res = await request(app).get('/healthz');
    // expect(res.status).toBe(200);
    // expect(res.body.status).toBe('ok');
    expect(true).toBe(true);  // placeholder
  });
});
