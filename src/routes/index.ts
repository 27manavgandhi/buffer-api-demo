import { Router } from 'express';
import v1Routes from './v1';
import v2Routes from './v2';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/v1', v1Routes);
router.use('/v2', v2Routes);
router.use('/admin', adminRoutes);

export default router;