import { Router } from 'express';

import { validate } from '../../common/middleware';
import { authController } from './auth.controller';
import { loginDtoSchema, refreshTokenDtoSchema } from './dto';
import { authenticate } from './middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginDtoSchema }), authController.login);
authRouter.post('/refresh', validate({ body: refreshTokenDtoSchema }), authController.refresh);
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/logout', authenticate, authController.logout);
