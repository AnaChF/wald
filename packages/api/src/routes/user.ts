import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index';
import { JWT_SECRET, optionalAuth, AuthRequest } from '../middleware/auth';

export const userRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/user/register
userRouter.post('/user/register', (req: Request, res: Response): void => {
  const { email, username, password } = req.body as {
    email?: string;
    username?: string;
    password?: string;
  };

  if (!email || !username || !password) {
    res.status(400).json({ error: 'email, username, and password are required' });
    return;
  }

  const id = uuidv4();
  const password_hash = hashPassword(password);

  try {
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, citizen_type)
      VALUES (@id, @email, @username, @password_hash, 'crowdster')
    `).run({ id, email: email.toLowerCase().trim(), username: username.trim(), password_hash });

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      data: {
        id,
        email: email.toLowerCase().trim(),
        username: username.trim(),
        citizen_type: 'crowdster',
        token,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email or username already taken' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// POST /api/user/login
userRouter.post('/user/login', (req: Request, res: Response): void => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = @email')
    .get({ email: email.toLowerCase().trim() }) as
    | {
        id: string;
        email: string;
        username: string;
        citizen_type: string;
        password_hash: string;
        created_at: string;
      }
    | undefined;

  if (!user || user.password_hash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      citizen_type: user.citizen_type,
      token,
    },
  });
});

// GET /api/user/:id/profile
userRouter.get('/user/:id/profile', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const user = db
    .prepare('SELECT id, email, username, citizen_type, created_at FROM users WHERE id = @id')
    .get({ id }) as
    | { id: string; email: string; username: string; citizen_type: string; created_at: string }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Count completed actions for profile enrichment
  const actionCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM user_actions WHERE user_id = @id').get({ id }) as {
      cnt: number;
    }
  ).cnt;

  res.json({
    data: {
      ...user,
      actions_completed: actionCount,
    },
  });
});
