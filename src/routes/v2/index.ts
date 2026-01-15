import { Router, Request, Response } from 'express';

const router = Router();

router.use('*', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'API v2 not yet implemented',
      availableVersions: ['v1'],
    },
  });
});

export default router;