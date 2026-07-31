const request = require('supertest');
const app = require('./index');

describe('Boulder Tracker API Tests', () => {
  // Test 1: Health Check
  it('should return 200 on the root health check endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Boulder Tracker Backend API is running!');
  });

  // Test 2: Weather API Integration
  it('should fetch weather data from Open-Meteo integration', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('temperature');
    expect(res.body).toHaveProperty('windspeed');
  });
});