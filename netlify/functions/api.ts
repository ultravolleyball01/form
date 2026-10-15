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
  try {
    const mutates = !['GET', 'HEAD', 'OPTIONS'].includes(event.httpMethod);
    return (await withNetlifyState(mutates, () => expressHandler(event, context))) as any;
  } catch (error) {
    console.error('Unhandled Netlify API error', {
      method: event.httpMethod,
      path: event.path,
      error: error instanceof Error ? error.name : 'unknown',
    });

    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      body: JSON.stringify({
        error: 'O serviço administrativo está temporariamente indisponível. Tente novamente em instantes.',
      }),
    };
  }
};
