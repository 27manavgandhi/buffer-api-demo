# Production-Grade Authentication API

A production-ready authentication system built with Node.js, TypeScript, Express, and MongoDB. This project demonstrates industry-level architecture patterns, security best practices, and clean code principles suitable for real SaaS products.

## 🏗️ Architecture

This project follows a **layered architecture** with clear separation of concerns:

```
routes → controllers → services → models → database
```

### Key Design Principles

- **Thin Controllers**: Controllers only handle HTTP concerns (request/response)
- **Service Layer**: All business logic lives in services
- **Model Layer**: Database operations and schema definitions
- **Middleware Pipeline**: Authentication, validation, and error handling
- **Dependency Direction**: Unidirectional flow prevents circular dependencies
- **Type Safety**: Strict TypeScript with no `any` types

### Project Structure

```
src/
├── config/          # Configuration and environment validation
├── models/          # Mongoose schemas and data models
├── services/        # Business logic layer
├── controllers/     # HTTP request handlers (thin)
├── routes/          # Route definitions and endpoint mapping
├── middleware/      # Reusable middleware (auth, validation, errors)
├── utils/           # Framework-agnostic utilities
├── types/           # TypeScript type definitions
├── app.ts           # Express application setup
└── server.ts        # Server entry point
```

## 🚀 Features

- **User Registration** with email validation and password strength requirements
- **User Login** with secure credential verification
- **JWT Authentication** with Bearer token support
- **Role-Based Authorization** (user/admin roles)
- **Global Error Handling** with custom error classes
- **Request ID Tracking** using UUID for debugging
- **Structured Logging** with Winston
- **Input Validation** using express-validator
- **Security Headers** with Helmet
- **Password Hashing** with bcrypt (10 salt rounds)
- **Type-Safe** with strict TypeScript configuration

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator, Zod
- **Security**: bcryptjs, helmet, cors
- **Logging**: Winston
- **Testing**: Jest, Supertest, MongoDB Memory Server

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/27manavgandhi/buffer-api-demo.git
cd buffer-api-demo
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables (see Configuration section)

5. Start MongoDB (if running locally):
```bash
mongod
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Environment Variable Requirements

- `PORT`: Server port number
- `MONGODB_URI`: MongoDB connection string (must be valid URL)
- `JWT_SECRET`: **Minimum 32 characters** for security
- `JWT_EXPIRES_IN`: Token expiration (e.g., "7d", "24h", "30m")
- `NODE_ENV`: Environment mode (development/production/test)

**Note**: The application validates all environment variables at startup and fails fast if any are missing or invalid.

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

### Format Code
```bash
npm run format
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Requirements:**
- Email: Valid email format
- Password: Min 8 chars, at least one uppercase, one lowercase, one number

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-01-13T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-01-13T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-01-13T10:30:00.000Z"
    }
  }
}
```

## 📝 Example Requests

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Password strength validation
   - Passwords never returned in responses

2. **JWT Security**
   - Secure secret key (min 32 chars)
   - Configurable expiration
   - Bearer token authentication

3. **Timing Attack Prevention**
   - Consistent error messages for login failures
   - No account enumeration via error messages

4. **Security Headers**
   - Helmet.js for HTTP security headers
   - CORS configuration

5. **Error Handling**
   - No stack traces in production
   - Sanitized error messages
   - Request ID tracking

## 🧪 Testing

The project includes comprehensive integration tests:

```bash
npm test
```

**Test Coverage Includes:**
- Successful user registration
- Duplicate email prevention
- Email and password validation
- Successful login
- Invalid credentials handling
- Protected route access
- Token validation

**Coverage Thresholds:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 🎯 Design Decisions

### Why Service Layer?

Services contain all business logic, making them:
- Framework-agnostic (no Express dependencies)
- Easily testable with unit tests
- Reusable across different contexts
- Single responsibility principle

### Why No Try-Catch Everywhere?

The `asyncHandler` utility wraps async functions, eliminating repetitive try-catch blocks while maintaining proper error handling.

### Why Custom Error Classes?

Custom error hierarchy provides:
- Type-safe error handling
- Consistent HTTP status codes
- Operational vs programming error distinction
- Better error logging

### Why Strict TypeScript?

Strict mode catches errors at compile time:
- No implicit `any`
- Null safety checks
- Unused variable detection
- Type-safe middleware

### Why Environment Validation?

Using Zod for environment validation:
- Fail-fast on startup
- Clear error messages
- Type inference
- No runtime surprises

## 🚀 Scalability Considerations

### Prepared for Future Features

The architecture supports easy addition of:
- **Refresh Tokens**: Service layer can be extended
- **Email Verification**: New service methods
- **Password Reset**: Additional routes and services
- **OAuth Integration**: Service abstraction allows multiple auth providers
- **Rate Limiting**: Middleware can be added to routes

### Extensible Role System

Roles are not hard-coded. The `authorize` middleware accepts any role:

```typescript
// Easy to add new roles
router.get('/admin', authenticate, authorize('admin'), handler);
router.get('/moderator', authenticate, authorize('moderator', 'admin'), handler);
```

### Database Optimization

- Indexed email field for fast lookups
- Proper schema validation
- Timestamps for audit trails

## 📚 Code Quality

### Linting & Formatting

- ESLint with TypeScript rules
- Prettier for consistent formatting
- Import ordering enforcement
- No unused variables/imports

### Type Safety

- Strict TypeScript configuration
- No `any` types allowed
- Custom type definitions for Express
- Typed DTOs for request/response

### Best Practices

- Single Responsibility Principle
- Dependency Injection
- Interface Segregation
- Clean Code principles

## 🤝 Contributing

This is a portfolio project demonstrating production-grade patterns. Feel free to use it as a reference or starting point for your own projects.

## 📄 License

MIT

---

**Built with attention to production-quality patterns and engineering practices.**