import { Router } from 'express';
import authRouter from './auth.routes.js';
import categoryRouter from './category.routes.js';
import productRouter from './product.routes.js';
import mediaRouter from './media.routes.js';
import cartRouter from './cart.routes.js';
import orderRouter from './order.routes.js';
import paymentRouter from './payment.routes.js';
import couponRouter from './coupon.routes.js';
import userRouter from './user.routes.js';
import addressRouter from './address.routes.js';

const router = Router();

// Mount all v1 route submodules
router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/media', mediaRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/payments', paymentRouter);
router.use('/coupons', couponRouter);
router.use('/users', userRouter);
router.use('/addresses', addressRouter);

export default router;
