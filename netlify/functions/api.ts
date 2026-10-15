import type { Handler } from '@netlify/functions';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import serverless from 'serverless-http';

interface NetlifyApiRuntime {
  expressHandler: ReturnType<typeof serverless>;
  withNetlifyState: typeof import('../../server/netlify-state').withNetlifyState;
}

let runtimePromise: Promise<NetlifyApiRuntime> | undefined;

function getRuntime(): Promise<NetlifyApiRuntime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      // Keep application configuration and database initialization inside the
      // handler boundary so cold-start failures still produce a JSON response.
      await import('../../server/config');
      const [{ apiRouter }, { withNetlifyState }] = await Promise.all([
        import('../../server/routes'),
        import('../../server/netlify-state'),
      ]);

      const app = express();
      app.set('trust proxy', 1);
      app.use(helmet({ contentSecurityPolicy: false }));
      app.use(express.json({ limit: '64kb' }));
      app.use(express.urlencoded({ extended: true, limit: '64kb' }));
      app.use(cookieParser());
      app.use('/api', apiRouter);
      app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
        const statusCandidate = typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: unknown }).status)
          : 500;
        const status = Number.isInteger(statusCandidate) && statusCandidate >= 400 && statusCandidate < 600
          ? statusCandidate
          : 500;

        console.error('Unhandled Express API error', {
          method: req.method,
          path: req.path,
          error: error instanceof Error ? error.name : 'unknown',
          message: error instanceof Error ? error.message : undefined,
        });

        if (!res.headersSent) {
          res.status(status).json({
            error: status === 500
              ? 'Erro interno ao processar a requisição.'
              : 'A requisição enviada é inválida.',
          });
        }
      });

      return {
        expressHandler: serverless(app),
        withNetlifyState,
      };
    })().catch((error) => {
      // Permit a warm function instance to recover after a transient startup
      // failure instead of retaining a permanently rejected promise.
      runtimePromise = undefined;
      throw error;
    });
  }

  return runtimePromise;
}

function getPublicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const missingVariable = message.match(/^(ADMIN_SESSION_SECRET|ADMIN_INITIAL_PASSWORD|INFINITEPAY_HANDLE|APP_URL)\b/);
  if (missingVariable) {
    return `Configuração obrigatória ausente ou inválida: ${missingVariable[1]}.`;
  }
  if (error instanceof Error && error.name === 'MissingDatabaseConnectionError') {
    return 'A conexão com o Netlify Database não está disponível para esta função.';
  }
  if (/permission denied/i.test(message)) {
    return 'O Netlify Database recusou o acesso à tabela da aplicação.';
  }
  return 'O serviço administrativo está temporariamente indisponível. Tente novamente em instantes.';
}

export const handler: Handler = async (event, context) => {
  try {
    const { expressHandler, withNetlifyState } = await getRuntime();
    const mutates = !['GET', 'HEAD', 'OPTIONS'].includes(event.httpMethod);
    return (await withNetlifyState(mutates, () => expressHandler(event, context))) as any;
  } catch (error) {
    console.error('Unhandled Netlify API error', {
      method: event.httpMethod,
      path: event.path,
      error: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : undefined,
    });

    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      body: JSON.stringify({
        error: getPublicErrorMessage(error),
      }),
    };
  }
};
