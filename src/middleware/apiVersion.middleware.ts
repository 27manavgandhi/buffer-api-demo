import { Request, Response, NextFunction } from 'express';

export const detectApiVersion = (req: Request, _res: Response, next: NextFunction): void => {
  const versionMatch = req.path.match(/^\/api\/(v\d+)\//);
  (req as any).apiVersion = versionMatch ? versionMatch[1] : 'unknown';
  next();
};