import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import { swaggerSpec } from './config/swagger';
import { trackResponseTime } from './middleware/analytics.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import v1Routes from './routes/v1';
import v2Routes from './routes/v2';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { NotFoundError } from './utils/errors.util';
import { logger } from './utils/logger.util';

const app = express();

app.use(helmet());
app.use(cors());
app.use(trackResponseTime);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  logger.debug('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', apiLimiter);
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
app.use('/api/admin', adminRoutes);

app.use((_req: Request, _res: Response) => {
  throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export default app;