import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { NotFoundError } from './utils/errors.util';
import { logger } from './utils/logger.util';

const app = express();

app.use(helmet());
app.use(cors());
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

console.log('Auth routes:', authRoutes); // DEBUG LINE
console.log('Auth routes type:', typeof authRoutes); // DEBUG LINE

app.use('/api/v1/auth', authRoutes);

app.use((_req: Request, _res: Response) => {
  throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export default app;