import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, hashPassword } from './db';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export function createAdminToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyAdminToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, timestampStr, signature] = parts;
    const payload = `${userId}:${timestampStr}`;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    // Check expiration (7 days)
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    const admin = db.findAdminById(userId);
    if (!admin || admin.role !== 'admin') {
      return null;
    }

    return { userId };
  } catch (err) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: { id: string; username: string; role: string; name: string };
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check Authorization header or cookie
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Acesso restrito. Faça login para continuar.' });
    return;
  }

  const verified = verifyAdminToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }

  const user = db.findAdminById(verified.userId);
  if (!user) {
    res.status(401).json({ error: 'Usuário não encontrado' });
    return;
  }

  req.adminUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  };

  next();
}
