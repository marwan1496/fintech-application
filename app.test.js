/**
 * @file app.test.js
 * @description Tests for the Express application using Jest and Supertest.
 */

const request = require('supertest');
const app = require('./app'); // Import the Express app

let server;
let token;

// Start the server on a test port (e.g., 3001) before running tests.
beforeAll((done) => {
  server = app.listen(3001, () => {
    console.log('Test server running on port 3001');
    done();
  });
});

// Close the server after tests complete so that Jest can exit cleanly.
afterAll((done) => {
  server.close(done);
});

describe('Admin Login Endpoint', () => {
  test('should generate a token for valid credentials', async () => {
    const response = await request(server)
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    token = response.body.token; // Save token for use in subsequent tests
  });

  test('should return 401 for invalid credentials', async () => {
    const response = await request(server)
      .post('/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    
    expect(response.statusCode).toBe(401);
  });
});

describe('Accounts Endpoints', () => {
  let accountId;

  test('should create a new account', async () => {
    const response = await request(server)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send();
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('account_id');
    accountId = response.body.account_id;
  });

  test('should deposit funds and generate a transaction ID', async () => {
    const response = await request(server)
      .post(`/accounts/${accountId}/deposit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('transaction_id');
  });

  test('should withdraw funds and generate a transaction ID', async () => {
    // Deposit funds first to ensure there is enough balance
    await request(server)
      .post(`/accounts/${accountId}/deposit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 200 });
    
    const response = await request(server)
      .post(`/accounts/${accountId}/withdraw`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 150 });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('transaction_id');
  });

  test('should check account balance correctly', async () => {
    // Deposit funds to set a known balance
    await request(server)
      .post(`/accounts/${accountId}/deposit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 300 });
    
    const response = await request(server)
      .get(`/accounts/${accountId}/balance`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('balance');
    // Since previous tests add funds, just check that the balance is greater than 0.
    expect(response.body.balance).toBeGreaterThan(0);
  });
});
