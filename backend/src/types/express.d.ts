import type { Logger } from 'pino';

import type { AuthContext } from '../common/middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      log: Logger;
      requestId: string;
    }
  }
}

export {};
