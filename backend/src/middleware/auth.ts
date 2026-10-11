import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { AppError } from './errorHandler';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined = undefined;

    // 1. Try reading HTTP-only cookie
    if (req.cookies && req.cookies.hacxlerate_token) {
      token = req.cookies.hacxlerate_token;
    }

    // 2. Fallback to Authorization: Bearer <token> header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please sign in.', 401);
    }

    // 3. Verify JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new AppError('Invalid or expired authentication session. Please sign in again.', 401);
    }

    // 4. Find user in MongoDB
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User account associated with this session no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Contact support for reactivation.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] roles, but user is [${req.user.role}].`,
          403
        )
      );
    }

    next();
  };
}
