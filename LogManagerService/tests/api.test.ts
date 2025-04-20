import request from 'supertest';
import app from '../src/app'; 

describe('GET /logs', () => {
  it('should return log entries with pagination', async () => {
    const res = await request(app).get('/v1/logs?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });
});


describe('DELETE /logs/:id', () => {
  it('should delete a log entry', async () => {
    const res = await request(app).delete('/v1/logs/1');
    expect(res.statusCode).toBe(200);
  });

  it('should return 404 for wrong-id log entry', async () => {
    const res = await request(app).delete('/v1/logs/wrong-id');
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for incorrect-id log entry', async () => {
    const res = await request(app).delete('/v1/logs/9999');
    expect(res.statusCode).toBe(404);
  });
});