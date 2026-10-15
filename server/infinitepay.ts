import crypto from 'crypto';
import { db } from './db';
import type { Payment, Registration } from '../src/types';

const DEFAULT_API_URL = 'https://api.checkout.infinitepay.io';
const PROVIDER_TIMEOUT_MS = 8_000;
const ALLOWED_CHECKOUT_HOSTS = new Set([
  'checkout.infinitepay.com.br',
  'checkout.infinitepay.io',
]);

export interface CreatePaymentLinkParams {
  orderNsu: string;
  amountCents: number;
  customerName: string;
  webhookToken: string;
  registrationPublicCode: string;
  returnUrl: string;
  webhookUrl: string;
}

export interface PaymentLinkResult {
  checkoutUrl: string;
  invoiceSlug?: string;
}

export interface PaymentCheckResult {
  success: boolean;
  paid: boolean;
  orderAmount?: number;
  paidAmount?: number;
  transactionNsu?: string;
  invoiceSlug?: string;
  installments?: number;
  captureMethod?: string;
  receiptUrl?: string;
  rawStatus?: string;
}

export type InfinitePayErrorCode =
  | 'configuration_error'
  | 'provider_rejected'
  | 'provider_timeout'
  | 'provider_unavailable'
  | 'invalid_provider_response';

export class InfinitePayError extends Error {
  constructor(
    message: string,
    public readonly code: InfinitePayErrorCode,
    public readonly httpStatus: number,
    public readonly providerStatus?: number
  ) {
    super(message);
    this.name = 'InfinitePayError';
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
}

function normalizeHandle(value: string | undefined): string {
  return (value || '').trim().replace(/^[$@]+/, '');
}

function safeProviderMessage(payload: unknown, handle?: string): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  const detail = record.message ?? record.error ?? record.detail;
  if (typeof detail !== 'string') return undefined;
  let sanitized = detail
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/[A-Za-z0-9_-]{32,}/g, '[token]');
  if (handle) sanitized = sanitized.replaceAll(handle, '[handle]');
  return sanitized.slice(0, 180);
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function nonNegativeInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export class InfinitePayProvider {
  public getHandle(): string {
    // In production the deployment environment is authoritative. A stale value
    // saved through the admin panel must never override Netlify configuration.
    const raw = isProductionRuntime()
      ? process.env.INFINITEPAY_HANDLE
      : db.getSetting('infinitepay_handle') || process.env.INFINITEPAY_HANDLE;
    const handle = normalizeHandle(raw);
    if (!handle || !/^[^\s/?#]{2,100}$/.test(handle)) {
      throw new InfinitePayError(
        'INFINITEPAY_HANDLE não configurado ou inválido',
        'configuration_error',
        500
      );
    }
    return handle;
  }

  public getHandleDiagnostic(): { source: 'environment' | 'database'; masked: string } {
    const source = isProductionRuntime() || !db.getSetting('infinitepay_handle')
      ? 'environment'
      : 'database';
    const handle = this.getHandle();
    const masked = handle.length <= 4
      ? `${handle[0] || ''}***`
      : `${handle.slice(0, 2)}***${handle.slice(-2)}`;
    return { source, masked };
  }

  public getMode(): 'production' | 'sandbox' {
    if (isProductionRuntime()) return 'production';
    const fromDb = db.getSetting('infinitepay_mode');
    const raw = (fromDb || process.env.INFINITEPAY_MODE || 'production').toLowerCase().trim();
    return ['sandbox', 'teste', 'test'].includes(raw) ? 'sandbox' : 'production';
  }

  private getApiUrl(): string {
    const configured = (process.env.INFINITEPAY_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new InfinitePayError('INFINITEPAY_API_URL inválida', 'configuration_error', 500);
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      (isProductionRuntime() && url.hostname !== 'api.checkout.infinitepay.io')
    ) {
      throw new InfinitePayError('INFINITEPAY_API_URL não autorizada', 'configuration_error', 500);
    }
    return url.origin;
  }

  private async post(
    path: '/links' | '/payment_check',
    body: Record<string, unknown>,
    orderNsu: string
  ): Promise<Record<string, any>> {
    let response: Response;
    try {
      response = await fetch(`${this.getApiUrl()}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError');
      console.error('InfinitePay request failed', {
        operation: path,
        orderNsu,
        reason: timedOut ? 'timeout' : 'network_error',
      });
      throw new InfinitePayError(
        timedOut ? 'Tempo limite excedido ao consultar a InfinitePay' : 'InfinitePay indisponível',
        timedOut ? 'provider_timeout' : 'provider_unavailable',
        timedOut ? 504 : 502
      );
    }

    const rawBody = await response.text();
    let payload: unknown = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const detail = safeProviderMessage(
        payload,
        typeof body.handle === 'string' ? body.handle : undefined
      );
      console.error('InfinitePay request rejected', {
        operation: path,
        orderNsu,
        status: response.status,
        contentType: response.headers.get('content-type'),
        responseKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 12) : [],
        detail,
      });
      throw new InfinitePayError(
        detail || `InfinitePay respondeu com HTTP ${response.status}`,
        'provider_rejected',
        502,
        response.status
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      console.error('InfinitePay returned an invalid response', {
        operation: path,
        orderNsu,
        status: response.status,
        contentType: response.headers.get('content-type'),
      });
      throw new InfinitePayError(
        'A InfinitePay retornou uma resposta inválida',
        'invalid_provider_response',
        502
      );
    }

    return payload as Record<string, any>;
  }

  public static generateWebhookToken(): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  public async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    if (this.getMode() === 'sandbox') {
      return {
        checkoutUrl: `/checkout/infinitepay?order_nsu=${encodeURIComponent(params.orderNsu)}&token=${encodeURIComponent(params.webhookToken)}`,
      };
    }

    const data = await this.post('/links', {
      handle: this.getHandle(),
      order_nsu: params.orderNsu,
      redirect_url: params.returnUrl,
      webhook_url: params.webhookUrl,
      customer: {
        name: params.customerName,
      },
      items: [
        {
          quantity: 1,
          price: params.amountCents,
          description: `Camiseta Ultra Volleyball - ${params.registrationPublicCode}`,
        },
      ],
    }, params.orderNsu);

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(String(data.url || ''));
    } catch {
      throw new InfinitePayError(
        'A InfinitePay não retornou uma URL de checkout válida',
        'invalid_provider_response',
        502
      );
    }
    if (
      checkoutUrl.protocol !== 'https:' ||
      !ALLOWED_CHECKOUT_HOSTS.has(checkoutUrl.hostname.toLowerCase())
    ) {
      console.error('InfinitePay returned an unexpected checkout host', {
        orderNsu: params.orderNsu,
        protocol: checkoutUrl.protocol,
        host: checkoutUrl.hostname,
      });
      throw new InfinitePayError(
        'A InfinitePay retornou um endereço de checkout inesperado',
        'invalid_provider_response',
        502
      );
    }

    return {
      checkoutUrl: checkoutUrl.href,
      // The real slug is supplied by the redirect/webhook. Never invent one.
      invoiceSlug: typeof data.slug === 'string' && data.slug ? data.slug : undefined,
    };
  }

  public async checkPayment(
    orderNsu: string,
    payment: Payment,
    details: { transactionNsu?: string; invoiceSlug?: string } = {}
  ): Promise<PaymentCheckResult> {
    if (this.getMode() === 'sandbox') {
      return payment.status === 'paid'
        ? {
            success: true,
            paid: true,
            orderAmount: payment.amount,
            paidAmount: payment.paid_amount ?? payment.amount,
            transactionNsu: payment.transaction_nsu,
            installments: payment.installments ?? 1,
            captureMethod: payment.capture_method || 'pix',
            receiptUrl: safeHttpsUrl(payment.receipt_url),
          }
        : { success: true, paid: false, rawStatus: payment.status };
    }

    const transactionNsu = details.transactionNsu || payment.transaction_nsu;
    const invoiceSlug = details.invoiceSlug || payment.invoice_slug;
    if (!transactionNsu || !invoiceSlug) {
      return { success: true, paid: false, rawStatus: 'awaiting_provider_reference' };
    }

    const data = await this.post('/payment_check', {
      handle: this.getHandle(),
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug: invoiceSlug,
    }, orderNsu);

    return {
      success: data.success === true,
      paid: data.success === true && data.paid === true,
      orderAmount: nonNegativeInteger(data.amount),
      paidAmount: nonNegativeInteger(data.paid_amount),
      transactionNsu,
      invoiceSlug,
      installments: nonNegativeInteger(data.installments),
      captureMethod: typeof data.capture_method === 'string' ? data.capture_method : undefined,
      receiptUrl: safeHttpsUrl(data.receipt_url),
      rawStatus: data.paid === true ? 'paid' : 'pending',
    };
  }
}

export const infinitePayProvider = new InfinitePayProvider();

export function confirmPayment(params: {
  orderNsu: string;
  transactionNsu: string;
  orderAmount: number;
  paidAmount?: number;
  captureMethod?: string;
  installments?: number;
  receiptUrl?: string;
}): { success: boolean; conflict?: boolean; error?: string; registration?: Registration; payment?: Payment } {
  const transactionNsu = params.transactionNsu.trim();
  if (!transactionNsu) {
    return { success: false, error: 'Transação não informada' };
  }

  const payment = db.findPaymentByOrderNsu(params.orderNsu);
  if (!payment) {
    return { success: false, error: 'Pagamento não encontrado' };
  }

  if (payment.status === 'paid') {
    if (payment.transaction_nsu !== transactionNsu) {
      console.error('Paid order received a different transaction reference', {
        orderNsu: params.orderNsu,
      });
      return { success: false, conflict: true, error: 'Transação diverge da confirmação anterior' };
    }

    // A consulta de status pode confirmar o pagamento antes do webhook. Como a
    // resposta documentada de payment_check não inclui obrigatoriamente o
    // comprovante, permita que o webhook idempotente complete esse dado depois.
    // Nunca substitua um comprovante já persistido.
    const receiptUrl = safeHttpsUrl(params.receiptUrl);
    const reconciledPayment = !payment.receipt_url && receiptUrl
      ? db.updatePayment(payment.id, { receipt_url: receiptUrl }) || payment
      : payment;

    return {
      success: true,
      payment: reconciledPayment,
      registration: db.getRegistrationById(payment.registration_id),
    };
  }

  if (!Number.isInteger(params.orderAmount) || params.orderAmount !== payment.amount) {
    console.error('Payment amount mismatch', {
      orderNsu: params.orderNsu,
      expected: payment.amount,
      received: params.orderAmount,
    });
    return { success: false, conflict: true, error: 'Valor confirmado diverge do valor esperado' };
  }

  const existingWithTransaction = db.findPaymentByTransactionNsu(transactionNsu);
  if (existingWithTransaction && existingWithTransaction.id !== payment.id) {
    console.error('Duplicate transaction reference', { orderNsu: params.orderNsu });
    return { success: false, conflict: true, error: 'Transação já associada a outra inscrição' };
  }

  const now = new Date().toISOString();
  const updatedPayment = db.updatePayment(payment.id, {
    status: 'paid',
    paid_amount: params.paidAmount,
    transaction_nsu: transactionNsu,
    capture_method: params.captureMethod,
    installments: params.installments,
    receipt_url: safeHttpsUrl(params.receiptUrl),
    error: undefined,
    paid_at: now,
  });

  db.updateRegistrationStatus(payment.registration_id, 'confirmed', now);
  return {
    success: true,
    payment: updatedPayment || payment,
    registration: db.getRegistrationById(payment.registration_id),
  };
}
