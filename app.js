/**
 * Express server application for managing accounts with admin authentication.
 * 
 * This application provides endpoints for:
 * - Admin login to generate a JWT token.
 * - Creating accounts.
 * - Depositing funds into an account.
 * - Withdrawing funds from an account.
 * - Checking an account's balance.
 *
 * The application uses in-memory storage for accounts (for demonstration purposes).
 * In a production environment, sensitive data (such as admin credentials and jwtSecret)
 * should be stored securely (e.g., using environment variables) and data persisted in a database.
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique transaction IDs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for generating and verifying JWT tokens
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON bodies in incoming requests

/**
 * Admin credentials and JWT configuration.
 * 
 * adminUsername: The hardcoded username for the admin account.
 * adminPassword: The hardcoded password for the admin account.
 * jwtSecret: The secret key used to sign JWT tokens (should be stored in an environment variable in production).
 * tokenExpiry: Defines the validity duration for the generated token.
 */
const adminUsername = "admin";
const adminPassword = "admin";
const jwtSecret = "56025E0C0FA4CBC84F060DAD39D8116B7B3161FC"; // In production, store this securely in a .env file
const tokenExpiry = "1h"; // Token expires in 1 hour 

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Admin login to generate a JWT token.
 *     description: Validate admin credentials and return a JWT token with an admin role claim.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials.
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate admin credentials
  if (username === adminUsername && password === adminPassword) {
    // Generate a JWT token with an admin role claim and set its expiration time
    const token = jwt.sign({ username, role: 'admin' }, jwtSecret, { expiresIn: tokenExpiry });
    return res.status(200).json({ token });
  }
  
  res.status(401).json({ error: "Invalid credentials" });
});

/**
 * Middleware to verify the JWT token for admin access.
 * 
 * This function checks for an 'Authorization' header in the request containing a Bearer token.
 * It extracts the token, verifies it using the jwtSecret, and if valid, attaches the decoded token
 * payload to req.admin. If the token is missing or invalid, it returns a 403 Forbidden error.
 * 
 * Parameters:
 *   - req: The Express request object. Expected to contain the 'Authorization' header.
 *   - res: The Express response object, used to send error responses.
 *   - next: The next middleware or route handler function.
 */
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  
  if (typeof bearerHeader !== 'undefined') {
    // Extract token from header ("Bearer <token>")
    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Token is not valid" });
      }
      // Attach decoded token payload to the request object for further use
      req.admin = decoded;
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    res.status(403).json({ error: "No token provided" });
  }
}

/**
 * In-memory storage for accounts.
 * 
 * accounts: An object that holds account records, using account IDs as keys.
 * nextAccountId: A counter used to generate unique account IDs.
 * 
 * Note: In a production application, accounts would be persisted in a database.
 */
const accounts = {};
let nextAccountId = 1;

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account.
 *     description: Creates a new account with an initial balance of 0 and returns the account ID.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Account created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account_id:
 *                   type: integer
 *       403:
 *         description: Unauthorized access.
 */
app.post('/accounts', verifyToken, (req, res) => {
  const account = { id: nextAccountId, balance: 0 };
  accounts[nextAccountId] = account;
  nextAccountId++;
  res.status(201).json({ account_id: account.id });
});

/**
 * @swagger
 * /accounts/{id}/deposit:
 *   post:
 *     summary: Deposit funds into an account.
 *     description: Deposit a specified amount into the account and return a unique transaction ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The account ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount to deposit (must be a positive value).
 *     responses:
 *       200:
 *         description: Funds deposited successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction_id:
 *                   type: string
 *       400:
 *         description: Invalid deposit amount.
 *       404:
 *         description: Account not found.
 *       403:
 *         description: Unauthorized access.
 */
app.post('/accounts/:id/deposit', verifyToken, (req, res) => {
  const accountId = parseInt(req.params.id, 10);
  const { amount } = req.body;

  if (!accounts[accountId]) {
    return res.status(404).json({ error: "Account not found" });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }

  accounts[accountId].balance += amount;
  // Generate a unique transaction ID using uuid
  const transactionId = uuidv4();
  res.status(200).json({ transaction_id: transactionId });
});

/**
 * @swagger
 * /accounts/{id}/withdraw:
 *   post:
 *     summary: Withdraw funds from an account.
 *     description: Withdraw a specified amount from the account and return a unique transaction ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The account ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount to withdraw (must be a positive value).
 *     responses:
 *       200:
 *         description: Withdrawal successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction_id:
 *                   type: string
 *       400:
 *         description: Invalid withdrawal amount or insufficient funds.
 *       404:
 *         description: Account not found.
 *       403:
 *         description: Unauthorized access.
 */
app.post('/accounts/:id/withdraw', verifyToken, (req, res) => {
  const accountId = parseInt(req.params.id, 10);
  const { amount } = req.body;

  if (!accounts[accountId]) {
    return res.status(404).json({ error: "Account not found" });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount" });
  }
  if (accounts[accountId].balance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  accounts[accountId].balance -= amount;
  // Generate a unique transaction ID using uuid
  const transactionId = uuidv4();
  res.status(200).json({ transaction_id: transactionId });
});

/**
 * @swagger
 * /accounts/{id}/balance:
 *   get:
 *     summary: Get account balance.
 *     description: Retrieve the current balance of the specified account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The account ID.
 *     responses:
 *       200:
 *         description: Balance retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *       404:
 *         description: Account not found.
 *       403:
 *         description: Unauthorized access.
 */
app.get('/accounts/:id/balance', verifyToken, (req, res) => {
  const accountId = parseInt(req.params.id, 10);
  
  if (!accounts[accountId]) {
    return res.status(404).json({ error: "Account not found" });
  }
  res.status(200).json({ balance: accounts[accountId].balance });
});

/**
 * Swagger configuration options.
 */
const options = {
  definition: {
    openapi: '3.0.0', // OpenAPI version
    info: {
      title: 'Axis Task API',
      version: '1.0.0',
      description: 'API for AXIS Task',
    },
    servers: [
      {
        url: 'http://localhost:3000', // URL of your API server
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    // Global security applies to all endpoints that do not override it
    security: [{
      bearerAuth: []
    }]
  },
  // Include paths to the API docs (you can add more if needed)
  apis: ['./app.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Serve the Swagger UI on the /api-docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Start the Express server.
 * 
 * The server listens for incoming HTTP requests on the specified port.
 * Once the server starts, a message is logged to the console indicating that the server is running.
 */
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app; // Export the app for testing
