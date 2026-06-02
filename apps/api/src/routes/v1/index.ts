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
import reviewRouter from './review.routes.js';
import notificationRouter from './notification.routes.js';
import qaRouter from './qa.routes.js';
import sellerRouter from './seller.routes.js';

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
router.use('/reviews', reviewRouter);
router.use('/notifications', notificationRouter);
router.use('/qa', qaRouter);
router.use('/sellers', sellerRouter);

export default router;
