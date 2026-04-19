import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'wald-secret-dev-key';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      /* ignore — token is optional */
    }
  }
  next();
}
