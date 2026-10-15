import crypto from 'crypto';
import { db } from './db';
import type { Payment, Registration } from '../src/types';

export interface CreatePaymentLinkParams {
  orderNsu: string;
  attemptId: string;
  amountCents: number;
  webhookToken: string;
  registrationPublicCode: string;
  returnUrl: string;
  webhookUrl: string;
}

export interface PaymentLinkResult {
  checkoutUrl: string;
  invoiceSlug: string;
  providerData?: any;
}

export interface PaymentCheckResult {
  success: boolean;
  paid: boolean;
  paidAmount: number;
  transactionNsu?: string;
  installments?: number;
  captureMethod?: string;
  receiptUrl?: string;
  rawStatus?: string;
}

export class InfinitePayProvider {
  public getHandle(): string {
    const fromDb = db.getSetting('infinitepay_handle');
    const raw = fromDb || process.env.INFINITEPAY_HANDLE || '';
    return raw.replace('$', '').trim();
  }

  public getMode(): 'production' | 'sandbox' {
    if (process.env.NODE_ENV === 'production') return 'production';
    const fromDb = db.getSetting('infinitepay_mode');
    const raw = (fromDb || process.env.INFINITEPAY_MODE || 'production').toLowerCase().trim();
    if (raw === 'sandbox' || raw === 'teste' || raw === 'test') {
      return 'sandbox';
    }
    return 'production';
  }

  /**
   * Generates a 32-byte cryptographically secure token and its SHA-256 hash
   */
  public static generateWebhookToken(): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Creates payment link via InfinitePay official hosted checkout or Sandbox checkout
   */
  public async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    const invoiceSlug = `inv_${params.orderNsu.substring(0, 12)}`;
    const handle = this.getHandle();
    const mode = this.getMode();
    if (mode === 'production') {
      if (!handle) throw new Error('INFINITEPAY_HANDLE não configurado');

      const endpoint = process.env.INFINITEPAY_CHECKOUT_API_URL || 'https://api.checkout.infinitepay.io/links';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handle,
          order_nsu: params.orderNsu,
          redirect_url: params.returnUrl,
          webhook_url: params.webhookUrl,
          items: [
            {
              quantity: 1,
              price: params.amountCents,
              description: `Camiseta Ultra Volleyball - ${params.registrationPublicCode}`,
            },
          ],
        }),
      });

      const rawBody = await response.text();
      let data: any = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = {};
      }
      if (!response.ok || !data.url) {
        console.error('InfinitePay checkout request rejected', {
          status: response.status,
          contentType: response.headers.get('content-type'),
          response: rawBody.slice(0, 500),
        });
        const message = data.message || data.error || `HTTP ${response.status}`;
        throw new Error(`InfinitePay recusou a criação do checkout: ${message}`);
      }

      return {
        checkoutUrl: data.url,
        invoiceSlug: data.slug || invoiceSlug,
        providerData: data,
      };
    }

    // Integrated sandbox checkout gateway
    const checkoutUrl = `/checkout/infinitepay?order_nsu=${params.orderNsu}&token=${params.webhookToken}`;
    return {
      checkoutUrl,
      invoiceSlug,
    };
  }

  /**
   * Checks payment status from the provider server-side
   */
  public async checkPayment(
    orderNsu: string,
    payment: Payment,
    details: { transactionNsu?: string; invoiceSlug?: string } = {}
  ): Promise<PaymentCheckResult> {
    if (this.getMode() === 'production') {
      const transactionNsu = details.transactionNsu || payment.transaction_nsu;
      const invoiceSlug = details.invoiceSlug || payment.invoice_slug;
      if (!transactionNsu || !invoiceSlug) {
        return { success: true, paid: false, paidAmount: 0, rawStatus: 'awaiting_provider_reference' };
      }

      const endpoint = process.env.INFINITEPAY_PAYMENT_CHECK_API_URL || 'https://api.checkout.infinitepay.io/payment_check';
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle: this.getHandle(),
            order_nsu: orderNsu,
            transaction_nsu: transactionNsu,
            slug: invoiceSlug,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { success: false, paid: false, paidAmount: 0, rawStatus: `http_${response.status}` };
        }

        return {
          success: true,
          paid: data.paid === true,
          paidAmount: Number(data.amount),
          transactionNsu,
          installments: Number(data.installments) || 1,
          captureMethod: data.capture_method || 'pix',
          receiptUrl: data.receipt_url,
          rawStatus: data.paid ? 'paid' : 'pending',
        };
      } catch (err) {
        console.error('Failed to query InfinitePay checkout status:', err);
        return { success: false, paid: false, paidAmount: 0, rawStatus: 'provider_unavailable' };
      }
    }

    // In sandbox / simulated mode or if already marked paid in payment object
    if (payment.status === 'paid') {
      return {
        success: true,
        paid: true,
        paidAmount: payment.paid_amount || payment.amount,
        transactionNsu: payment.transaction_nsu,
        installments: payment.installments || 1,
        captureMethod: payment.capture_method || 'pix',
        receiptUrl: payment.receipt_url,
      };
    }

    return {
      success: true,
      paid: false,
      paidAmount: 0,
      rawStatus: payment.status,
    };
  }
}

export const infinitePayProvider = new InfinitePayProvider();

/**
 * Central idempotent payment confirmation function.
 * Webhook and payment-check both use this function.
 */
export function confirmPayment(params: {
  orderNsu: string;
  transactionNsu: string;
  paidAmount: number;
  captureMethod?: string;
  installments?: number;
  receiptUrl?: string;
}): { success: boolean; error?: string; registration?: Registration; payment?: Payment } {
  const payment = db.findPaymentByOrderNsu(params.orderNsu);
  if (!payment) {
    return { success: false, error: 'Payment record not found for order_nsu' };
  }

  // Idempotency: if already paid, do not repeat
  if (payment.status === 'paid') {
    const reg = db.getRegistrationById(payment.registration_id);
    return { success: true, payment, registration: reg };
  }

  // Amount verification: paidAmount MUST match payment.amount
  if (params.paidAmount !== payment.amount) {
    console.error(`Amount mismatch: expected ${payment.amount}, received ${params.paidAmount}`);
    db.updatePayment(payment.id, {
      status: 'failed',
      error: `Valor divergente: esperado ${payment.amount}, recebido ${params.paidAmount}`,
    });
    db.updateRegistrationStatus(payment.registration_id, 'payment_failed');
    return { success: false, error: 'Valor pago diverge do valor esperado' };
  }

  // Uniqueness check for transaction_nsu: one transaction cannot pay two registrations
  if (params.transactionNsu) {
    const existingWithTransaction = db.findPaymentByTransactionNsu(params.transactionNsu);
    if (existingWithTransaction && existingWithTransaction.id !== payment.id) {
      console.error(`Duplicate transaction_nsu detected: ${params.transactionNsu}`);
      return { success: false, error: 'Esta transação já foi associada a outra inscrição' };
    }
  }

  const now = new Date().toISOString();

  // Update payment to paid
  const updatedPayment = db.updatePayment(payment.id, {
    status: 'paid',
    paid_amount: params.paidAmount,
    transaction_nsu: params.transactionNsu,
    capture_method: params.captureMethod || 'pix',
    installments: params.installments || 1,
    receipt_url: params.receiptUrl || `https://recibo.infinitepay.io/${params.transactionNsu}`,
    paid_at: now,
  });

  // Update registration to confirmed
  db.updateRegistrationStatus(payment.registration_id, 'confirmed', now);
  const updatedRegistration = db.getRegistrationById(payment.registration_id);

  return {
    success: true,
    payment: updatedPayment || payment,
    registration: updatedRegistration,
  };
}
