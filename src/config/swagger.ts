import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Buffer API Demo',
      version: '1.0.0',
      description: 'Production-grade social media scheduling API with authentication, post scheduling, and job queue management',
      contact: {
        name: 'Manav Gandhi',
        email: 'contact@example.com',
        url: 'https://github.com/27manavgandhi/buffer-api-demo',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            content: { type: 'string', maxLength: 280, example: 'Hello world!' },
            platform: { type: 'string', enum: ['twitter', 'linkedin', 'facebook'], example: 'twitter' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'failed'], example: 'scheduled' },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            requestId: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        QueueStats: {
          type: 'object',
          properties: {
            waiting: { type: 'number', example: 5 },
            active: { type: 'number', example: 2 },
            completed: { type: 'number', example: 150 },
            failed: { type: 'number', example: 3 },
            delayed: { type: 'number', example: 10 },
            paused: { type: 'boolean', example: false },
            total: { type: 'number', example: 170 },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Posts', description: 'Social media post management and scheduling' },
      { name: 'Admin', description: 'Administrative operations (requires admin role)' },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);