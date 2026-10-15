import type { NextFunction, Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { getAppUrl } from './config';

function getRateLimitKey(req: Request): string {
  // serverless-http does not always populate req.ip on Netlify. Draft-8
  // RateLimit headers hash this key, so an undefined value crashes before the
  // route handler runs. Netlify's connection IP header is the authoritative
  // source in production; the remaining values keep local development working.
  const netlifyIp = req.get('x-nf-client-connection-ip')?.trim();
  const forwardedIp = req.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = netlifyIp || forwardedIp || req.ip || req.socket.remoteAddress;

  return clientIp ? ipKeyGenerator(clientIp) : 'unknown-client';
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: 'Muitas inscrições enviadas. Tente novamente mais tarde.' },
});

export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: 'Muitas consultas de pagamento. Aguarde alguns minutos.' },
});

export function requireSameOrigin(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const origin = req.get('origin');
  if (!origin) {
    next();
    return;
  }

  const configuredOrigin = getAppUrl();
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin !== configuredOrigin && origin !== requestOrigin) {
    res.status(403).json({ error: 'Origem da requisição não autorizada' });
    return;
  }

  next();
}
