import type { Handler } from '@netlify/functions';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import serverless from 'serverless-http';
import '../../server/config';
import { apiRouter } from '../../server/routes';
import { withNetlifyState } from '../../server/netlify-state';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));
app.use(cookieParser());
app.use('/api', apiRouter);

const expressHandler = serverless(app);

export const handler: Handler = async (event, context) => {
  const mutates = !['GET', 'HEAD', 'OPTIONS'].includes(event.httpMethod);
  return (await withNetlifyState(mutates, () => expressHandler(event, context))) as any;
};
