import bcrypt from 'bcryptjs';

import { authConfig } from '../../config';

export class PasswordService {
  public async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, authConfig.bcryptRounds);
  }

  public async compare(plainTextPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}

export const passwordService = new PasswordService();
