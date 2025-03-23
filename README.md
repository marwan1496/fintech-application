# fintech-application

# fintech-application

Fintech Application is a backend service built with Node.js and Express for managing user accounts with JWT authentication. The API allows users to log in, create accounts, deposit funds, withdraw funds, and check account balances. For demonstration purposes, the data is stored in memory. In a production environment, sensitive credentials (like JWT secrets) should be stored securely (for example, in environment variables), and data should be persisted using a database.

## Features

- **User Authentication:**
  - **Login Endpoint:** Users log in using the `/login` endpoint. Use the following credentials:
    - **Username:** `user`
    - **Password:** `user`
  - Upon successful login, a JWT token is generated with the `user` role.

- **Account Management:**
  - **Create Account:** `POST /accounts` – Creates a new account with an initial balance of 0.
  - **Deposit Funds:** `POST /accounts/{id}/deposit` – Deposits a specified amount into an account and returns a unique transaction ID.
  - **Withdraw Funds:** `POST /accounts/{id}/withdraw` – Withdraws a specified amount from an account and returns a unique transaction ID.
  - **Check Balance:** `GET /accounts/{id}/balance` – Retrieves the current balance of an account.

- **API Documentation:**  
  The API is fully documented using OpenAPI (Swagger). You can view and test the endpoints interactively using the Swagger UI.

## Technologies

- **Node.js & Express:** Server and routing.
- **JWT:** JSON Web Tokens for user authentication.
- **Swagger (swagger-ui-express & swagger-jsdoc):** For API documentation.
- **express-openapi-validator:** (Optional) For validating requests against your OpenAPI specification.
- **uuid:** For generating unique transaction IDs.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/axis-task.git
   cd axis-task
