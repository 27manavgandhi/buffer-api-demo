# Production-Grade Social Media Scheduling API

A production-ready authentication and post scheduling system built with Node.js, TypeScript, Express, MongoDB, and Bull job queues. Features enterprise-grade rate limiting, API versioning, queue monitoring, analytics tracking, and comprehensive documentation.

## 🏗️ Architecture

This project follows a **layered architecture** with clear separation of concerns:

```
routes → controllers → services → models → database
```

### Key Design Principles

- **Thin Controllers**: Controllers only handle HTTP concerns (request/response)
- **Service Layer**: All business logic lives in services
- **Model Layer**: Database operations and schema definitions
- **Middleware Pipeline**: Authentication, validation, rate limiting, and error handling
- **Dependency Direction**: Unidirectional flow prevents circular dependencies
- **Type Safety**: Strict TypeScript with no `any` types

### Project Structure

```
production-auth-api/
├── src/
│   ├── config/          # Configuration and environment validation
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── redis.ts
│   │   └── swagger.ts
│   ├── models/          # Mongoose schemas and data models
│   │   ├── User.model.ts
│   │   ├── Post.model.ts
│   │   └── ApiUsage.model.ts
│   ├── services/        # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── post.service.ts
│   │   ├── queue.service.ts
│   │   ├── analytics.service.ts
│   │   └── rateLimit.service.ts
│   ├── controllers/     # HTTP request handlers (thin)
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   ├── queue.controller.ts
│   │   └── analytics.controller.ts
│   ├── routes/          # Route definitions
│   │   ├── v1/
│   │   │   ├── auth.routes.ts
│   │   │   ├── post.routes.ts
│   │   │   └── index.ts
│   │   ├── v2/
│   │   │   └── index.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   ├── middleware/      # Reusable middleware
│   │   ├── auth.middleware.ts
│   │   ├── authorize.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── analytics.middleware.ts
│   │   └── apiVersion.middleware.ts
│   ├── queues/          # Bull queue setup
│   │   └── post.queue.ts
│   ├── workers/         # Background job processors
│   │   └── post.worker.ts
│   ├── utils/           # Framework-agnostic utilities
│   │   ├── asyncHandler.util.ts
│   │   ├── errors.util.ts
│   │   ├── jwt.util.ts
│   │   ├── logger.util.ts
│   │   └── rateLimitStore.util.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── express.d.ts
│   │   ├── post.types.ts
│   │   └── analytics.types.ts
│   ├── app.ts           # Express application setup
│   ├── server.ts        # API server entry point
│   └── worker.ts        # Worker process entry point
├── tests/               # Integration tests
│   ├── auth.test.ts
│   ├── post.test.ts
│   ├── rateLimit.test.ts
│   ├── versioning.test.ts
│   ├── admin.test.ts
│   ├── analytics.test.ts
│   └── setup.ts
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Features

### Authentication & Authorization
- **User Registration** with email validation and password strength requirements
- **User Login** with secure credential verification
- **JWT Authentication** with Bearer token support
- **Role-Based Authorization** (user/admin roles)
- Timing attack prevention
- No account enumeration

### Post Scheduling
- **Create Posts** as draft or scheduled for future publishing
- **Schedule Posts** with automatic publishing via job queue
- **Update Posts** with intelligent rescheduling
- **Delete Posts** with automatic job cleanup
- **Multi-Platform Support** (Twitter, LinkedIn, Facebook)
- **Background Worker** processes scheduled posts automatically

### Rate Limiting
- **Redis-backed rate limiting** (distributed, survives restart)
- **API Limiter**: 100 requests/hour per IP
- **User Limiter**: 100 requests/hour per authenticated user
- **Auth Limiter**: 5 attempts/15min (brute force protection)
- **Strict Limiter**: 10 requests/hour for admin operations
- Rate limit headers in all responses
- Graceful degradation (fails open if Redis unavailable)

### API Versioning
- Clean v1/v2 route structure
- v1: Stable, production API
- v2: Placeholder (returns 501 Not Implemented)
- Backward compatibility guaranteed

### Queue Monitoring (Admin Only)
- View queue statistics (waiting, active, completed, failed, delayed)
- List jobs by status
- Pause/resume queue processing
- Clean old completed jobs
- Retry failed jobs

### Analytics & Monitoring
- Persistent analytics storage (MongoDB with 90-day TTL)
- Response time tracking for every request
- System-wide statistics
- Per-endpoint metrics
- Per-user analytics
- Error rate analysis
- Performance percentiles (p50, p95, p99)
- Date range filtering

### Infrastructure
- **Bull Job Queue** with Redis for reliable background processing
- **Retry Logic** with exponential backoff (3 attempts)
- **Job Persistence** survives server restarts
- **Global Error Handling** with custom error classes
- **Request ID Tracking** using UUID for debugging
- **Structured Logging** with Winston
- **Input Validation** using express-validator
- **Security Headers** with Helmet
- **API Documentation** with Swagger/OpenAPI

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache/Queue**: Redis with Bull
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator, Zod
- **Security**: bcryptjs, helmet, cors
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Documentation**: Swagger UI, swagger-jsdoc
- **Date Utilities**: date-fns
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

6. Start Redis (if running locally):
```bash
redis-server
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Environment Variable Requirements

- `PORT`: Server port number
- `MONGODB_URI`: MongoDB connection string (must be valid URL)
- `JWT_SECRET`: **Minimum 32 characters** for security
- `JWT_EXPIRES_IN`: Token expiration (e.g., "7d", "24h", "30m")
- `NODE_ENV`: Environment mode (development/production/test)
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis server port
- `REDIS_PASSWORD`: Redis password (optional)

**Note**: The application validates all environment variables at startup and fails fast if any are missing or invalid.

## 🏃 Running the Application

### Development Mode

**Terminal 1 - API Server:**
```bash
npm run dev
```

**Terminal 2 - Worker Process:**
```bash
npm run dev:worker
```

### Production Build
```bash
npm run build

# Terminal 1
npm start

# Terminal 2  
npm run start:worker
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
http://localhost:3000/api
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

---

### API Documentation
```http
GET /api-docs
```

Visit this URL in your browser for interactive Swagger UI documentation.

---

### Authentication Endpoints (v1)

#### Register User
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
      "createdAt": "2025-01-14T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Rate Limit**: 5 requests per 15 minutes

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Rate Limit**: 100 requests per hour (per user)

---

### Post Scheduling Endpoints (v1)

#### Create Post
```http
POST /api/v1/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello world! This is my first scheduled post.",
  "platform": "twitter",
  "scheduledAt": "2025-01-15T15:00:00.000Z"
}
```

**Platforms**: `twitter`, `linkedin`, `facebook`  
**Status Values**: `draft`, `scheduled`, `published`, `failed`  
**Rate Limit**: 100 requests per hour (per user)

#### Get All Posts (Paginated)
```http
GET /api/v1/posts?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Single Post
```http
GET /api/v1/posts/:id
Authorization: Bearer <token>
```

#### Update Post
```http
PUT /api/v1/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content",
  "scheduledAt": "2025-01-16T12:00:00.000Z"
}
```

**Note**: Cannot update published posts

#### Delete Post
```http
DELETE /api/v1/posts/:id
Authorization: Bearer <token>
```

---

### Queue Monitoring Endpoints (Admin Only)

#### Get Queue Statistics
```http
GET /api/admin/queue/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 10,
    "paused": false,
    "total": 170
  }
}
```

#### Get Jobs by Status
```http
GET /api/admin/queue/jobs?status=waiting&limit=10
Authorization: Bearer <admin-token>
```

**Valid statuses**: `waiting`, `active`, `completed`, `failed`, `delayed`

#### Pause Queue
```http
POST /api/admin/queue/pause
Authorization: Bearer <admin-token>
```

#### Resume Queue
```http
POST /api/admin/queue/resume
Authorization: Bearer <admin-token>
```

#### Clean Queue
```http
POST /api/admin/queue/clean?grace=0&limit=1000
Authorization: Bearer <admin-token>
```

#### Retry Failed Jobs
```http
POST /api/admin/queue/retry-failed
Authorization: Bearer <admin-token>
```

**Rate Limit**: 10 requests per hour (admin operations)

---

### Analytics Endpoints (Admin Only)

#### Get System Overview
```http
GET /api/admin/analytics/overview?startDate=2025-01-01T00:00:00Z&endDate=2025-01-14T23:59:59Z
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "avgResponseTime": 45.23,
    "errorRate": 2.5,
    "topEndpoints": [
      { "endpoint": "/api/v1/posts", "count": 500 },
      { "endpoint": "/api/v1/auth/login", "count": 250 }
    ]
  }
}
```

#### Get User Analytics
```http
GET /api/admin/analytics/users/:userId
Authorization: Bearer <admin-token>
```

#### Get Endpoint Analytics
```http
GET /api/admin/analytics/endpoints
Authorization: Bearer <admin-token>
```

#### Get Error Analytics
```http
GET /api/admin/analytics/errors
Authorization: Bearer <admin-token>
```

#### Get Performance Analytics
```http
GET /api/admin/analytics/performance
Authorization: Bearer <admin-token>
```

**Date Range Parameters** (optional for all analytics endpoints):
- `startDate`: ISO 8601 date-time
- `endDate`: ISO 8601 date-time

---

## 🔒 Rate Limiting

### Rate Limit Rules

| Endpoint Type | Limit | Window | Key |
|--------------|-------|--------|-----|
| General API | 100 req | 1 hour | IP address |
| Auth (login/register) | 5 req | 15 min | IP address |
| User endpoints | 100 req | 1 hour | User ID |
| Admin endpoints | 10 req | 1 hour | User ID |

### Rate Limit Headers

All responses include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

### Rate Limit Response (429)

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## 🔄 API Versioning

### Current Versions

- **v1**: Stable production API (fully functional)
- **v2**: Not yet implemented (returns 501)

### Version Structure

```
/api/v1/auth/*  → Auth endpoints (working)
/api/v1/posts/* → Post endpoints (working)
/api/v2/*       → Returns 501 Not Implemented
```

### v2 Response

```json
{
  "success": false,
  "error": {
    "message": "API v2 not yet implemented",
    "availableVersions": ["v1"]
  }
}
```

### Backward Compatibility

v1 behavior is guaranteed to remain stable. Future versions (v2, v3) will never break v1 compatibility.

---

## 📊 Analytics & Monitoring

### Data Retention

Analytics data is automatically deleted after **90 days** (GDPR compliance via MongoDB TTL index).

### Tracked Metrics

- Request count
- Response time
- Status codes
- Error rates
- Endpoint popularity
- User activity
- Performance percentiles

### Analytics Storage

Every API request is logged to:
1. **Winston logger** (immediate, structured logging)
2. **MongoDB** (persistent analytics, fire-and-forget)

Analytics writes are non-blocking and never slow down API responses.

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- auth.test.ts
npm test -- post.test.ts
npm test -- rateLimit.test.ts
npm test -- versioning.test.ts
npm test -- admin.test.ts
npm test -- analytics.test.ts
```

### Test Coverage
```bash
npm test -- --coverage
```

**Coverage Thresholds:**
- Statements: 50%
- Branches: 50%
- Functions: 50%
- Lines: 50%

### Test Structure

- `tests/auth.test.ts` - Authentication tests
- `tests/post.test.ts` - Post scheduling tests
- `tests/rateLimit.test.ts` - Rate limiting tests
- `tests/versioning.test.ts` - API versioning tests
- `tests/admin.test.ts` - Admin endpoint tests
- `tests/analytics.test.ts` - Analytics tests

All tests use:
- MongoDB Memory Server (in-memory database)
- Mocked Redis client
- Mocked Bull queues
- Supertest for HTTP testing

---

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Password strength validation
   - Passwords never returned in responses

2. **JWT Security**
   - Secure secret key (min 32 chars)
   - Configurable expiration
   - Bearer token authentication

3. **Rate Limiting**
   - Brute force protection (auth endpoints)
   - DDoS protection (API-wide)
   - Distributed rate limiting (Redis-backed)
   - Fail-open strategy (availability over strict limiting)

4. **Input Validation**
   - express-validator on all inputs
   - MongoDB ObjectId validation
   - Date range validation
   - Email format validation

5. **Security Headers**
   - Helmet.js for HTTP security headers
   - CORS configuration

6. **Error Handling**
   - No stack traces in production
   - Sanitized error messages
   - Request ID tracking
   - Proper HTTP status codes

7. **Authorization**
   - Role-based access control
   - Users can only access their own posts
   - Admin-only routes protected
   - Cannot update published posts

---

## 📚 Architecture Decisions

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

### Why Bull Queue?

Bull provides:
- Redis-backed persistence
- Retry logic with backoff
- Job prioritization
- Horizontal scaling (multiple workers)
- Event monitoring

### Why Separate Worker Process?

- Independent scaling (scale workers separately from API)
- Fault isolation (worker crashes don't affect API)
- Resource allocation (different CPU/memory needs)
- Clear separation of concerns

---

## 🚀 Scalability

### Horizontal Scaling

- **Multiple API Servers**: Stateless design allows load balancing
- **Multiple Workers**: Bull supports concurrent job processing
- **Redis Clustering**: For high-availability queues
- **MongoDB Replica Sets**: For database redundancy

### Database Optimization

- Indexed email field for fast lookups
- Compound indexes on userId + status
- Compound indexes on userId + scheduledAt
- TTL index for automatic data cleanup
- Pagination for list endpoints

### Queue Optimization

- Job deduplication via jobId
- Configurable retry strategies
- Automatic job cleanup
- Event-driven monitoring
- Redis connection pooling

### Future Features Ready

The architecture supports:
- Refresh tokens (minimal refactor)
- Email verification (new service methods)
- Password reset (additional routes)
- OAuth integration (service abstraction)
- Actual platform APIs (replace simulation)
- Webhook notifications (post-publish callbacks)
- Real-time notifications (WebSocket support)

---

## 🐛 Troubleshooting

### Issue: "ECONNREFUSED 127.0.0.1:6379"
**Solution**: Redis not running
```bash
redis-server
```

### Issue: "ECONNREFUSED 127.0.0.1:27017"
**Solution**: MongoDB not running
```bash
mongod
```

### Issue: Posts stay "scheduled" forever
**Solution**: Worker not running
```bash
npm run dev:worker
```

### Issue: TypeScript compilation errors
**Solution**: Rebuild
```bash
npm run build
```

### Issue: Tests failing on Redis connection
**Solution**: Tests mock Redis (check jest.mock in test files)

### Issue: Rate limiting not working
**Solution**: 
1. Check Redis is running: `redis-cli ping`
2. Check rate limit headers in responses
3. Verify RedisStore is properly initialized

### Issue: Admin endpoints return 403
**Solution**: Make sure user has admin role
```bash
mongosh
use auth_db
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Update JWT_SECRET (min 32 characters)
- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB URI
- [ ] Configure production Redis credentials
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password
- [ ] Setup HTTPS/SSL
- [ ] Configure CORS for frontend domain
- [ ] Setup monitoring (Uptime Robot, DataDog, etc.)
- [ ] Setup error tracking (Sentry)
- [ ] Configure log aggregation
- [ ] Setup database backups
- [ ] Configure firewall rules
- [ ] Setup CI/CD pipeline
- [ ] Create production .env file
- [ ] Test all endpoints in staging
- [ ] Load test with realistic traffic
- [ ] Setup process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Setup auto-scaling rules
- [ ] Document runbook procedures

---

## 🤝 Contributing

This is a portfolio project demonstrating production-grade patterns. Feel free to use it as a reference or starting point for your own projects.

## 📄 License

MIT

---

**Repository**: https://github.com/27manavgandhi/buffer-api-demo

**Built with attention to production-quality patterns and senior-level engineering practices. Architecture inspired by Buffer's engineering team.**

**⭐ Star this repo if you find it useful!**

