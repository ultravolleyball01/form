import { Router } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword, generateUUID } from './db';
import {
  infinitePayProvider,
  confirmPayment,
  InfinitePayProvider,
} from './infinitepay';
import {
  createAdminToken,
  requireAdminAuth,
  type AuthenticatedRequest,
} from './auth';
import type { FormField, ClassItem, ShirtSize, RegistrationStatus } from '../src/types';
import { loginLimiter, paymentLimiter, registrationLimiter, requireSameOrigin } from './security';
import { z } from 'zod';
import { getAppUrl } from './config';

export const apiRouter = Router();
apiRouter.use('/admin', requireSameOrigin);

const registrationInputSchema = z.object({
  full_name: z.string().trim().min(3).max(150),
  class_id: z.string().uuid(),
  shirt_size_id: z.string().uuid(),
  dynamic_answers: z.record(z.string(), z.unknown()).optional().default({}),
});

const createOrderInputSchema = z.object({
  registration_id: z.string().uuid(),
  attempt_id: z.string().trim().min(8).max(128),
});

const paymentCheckInputSchema = z.object({
  order_nsu: z.string().uuid(),
  transaction_nsu: z.string().trim().max(200).optional(),
  invoice_slug: z.string().trim().max(200).optional(),
});

const loginInputSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * GET /api/public-config
 * Returns active configuration for the public registration form
 */
apiRouter.get('/public-config', (req, res) => {
  try {
    const shirt_price = db.getShirtPrice();
    const form_fields = db.getFormFields(true);
    const classes = db.getClasses(true);
    const shirt_sizes = db.getShirtSizes(true);

    res.json({
      shirt_price,
      form_fields,
      classes,
      shirt_sizes,
    });
  } catch (err: any) {
    console.error('Error in /api/public-config:', err);
    res.status(500).json({ error: 'Erro ao carregar configurações do formulário' });
  }
});

/**
 * POST /api/registrations
 * Creates a new pending registration from public form submission
 */
apiRouter.post('/registrations', registrationLimiter, (req, res) => {
  try {
    const parsed = registrationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados da inscrição inválidos.' });
      return;
    }
    const { full_name, class_id, shirt_size_id, dynamic_answers } = parsed.data;

    // 1. Validate full_name
    const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!trimmedName || trimmedName.length < 3) {
      res.status(400).json({ error: 'O nome completo é obrigatório (mínimo 3 caracteres).' });
      return;
    }

    // 2. Validate class_id
    if (!class_id) {
      res.status(400).json({ error: 'A seleção da turma é obrigatória.' });
      return;
    }
    const classItem = db.getClassById(class_id);
    if (!classItem || !classItem.active) {
      res.status(400).json({ error: 'A turma selecionada não é válida ou foi desativada.' });
      return;
    }

    // 3. Validate shirt_size_id
    if (!shirt_size_id) {
      res.status(400).json({ error: 'A seleção do tamanho da camiseta é obrigatória.' });
      return;
    }
    const shirtSize = db.getShirtSizeById(shirt_size_id);
    if (!shirtSize || !shirtSize.active) {
      res.status(400).json({ error: 'O tamanho de camiseta selecionado não é válido ou foi desativado.' });
      return;
    }

    // 4. Validate dynamic required fields
    const activeFields = db.getFormFields(true);
    const answersToSave: Array<{
      field_id: string;
      field_key_snapshot: string;
      label_snapshot: string;
      value: string;
    }> = [];

    // System fields snapshots in answers
    const fullNameField = activeFields.find((f) => f.key === 'full_name');
    answersToSave.push({
      field_id: fullNameField ? fullNameField.id : 'system_full_name',
      field_key_snapshot: 'full_name',
      label_snapshot: fullNameField ? fullNameField.label : 'Nome completo',
      value: trimmedName,
    });

    const classField = activeFields.find((f) => f.key === 'class_id');
    answersToSave.push({
      field_id: classField ? classField.id : 'system_class_id',
      field_key_snapshot: 'class_id',
      label_snapshot: classField ? classField.label : 'Unidade/Turma',
      value: classItem.display_label,
    });

    const sizeField = activeFields.find((f) => f.key === 'shirt_size_id');
    answersToSave.push({
      field_id: sizeField ? sizeField.id : 'system_shirt_size_id',
      field_key_snapshot: 'shirt_size_id',
      label_snapshot: sizeField ? sizeField.label : 'Tamanho camiseta',
      value: `${shirtSize.code} (${shirtSize.category === 'adult' ? 'Adulto' : 'Infantil'}) - ${shirtSize.width_cm}x${shirtSize.length_cm} cm`,
    });

    // Check custom dynamic fields
    const customAnswers = dynamic_answers && typeof dynamic_answers === 'object' ? dynamic_answers : {};
    for (const field of activeFields) {
      if (field.system_type) continue; // Already handled above

      const rawVal = customAnswers[field.id];
      const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

      if (field.required && !valStr) {
        res.status(400).json({ error: `O campo "${field.label}" é obrigatório.` });
        return;
      }

      if (valStr) {
        answersToSave.push({
          field_id: field.id,
          field_key_snapshot: field.key,
          label_snapshot: field.label,
          value: valStr,
        });
      }
    }

    // 5. Query current shirt price from system_settings (Rule 3: frontend cannot dictate price)
    const shirt_price = db.getShirtPrice();

    // 6. Create registration record with historical snapshot
    const registration = db.createRegistration(
      {
        participant_name: trimmedName,
        class_id: classItem.id,
        class_label_snapshot: classItem.display_label,
        shirt_size_id: shirtSize.id,
        shirt_size_code_snapshot: shirtSize.code,
        shirt_width_cm_snapshot: shirtSize.width_cm,
        shirt_length_cm_snapshot: shirtSize.length_cm,
        shirt_category_snapshot: shirtSize.category,
        shirt_quantity: 1, // Rule 1: always 1
        amount: shirt_price, // Preserved snapshot
        status: 'pending_payment',
      },
      answersToSave
    );

    res.status(201).json({
      registration: {
        id: registration.id,
        public_code: registration.public_code,
        participant_name: registration.participant_name,
        class_label: registration.class_label_snapshot,
        shirt_size_code: registration.shirt_size_code_snapshot,
        shirt_category: registration.shirt_category_snapshot,
        amount: registration.amount,
        status: registration.status,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/registrations:', err);
    res.status(500).json({ error: 'Erro ao processar inscrição' });
  }
});

/**
 * POST /api/create-order
 * Starts checkout payment flow with InfinitePay
 */
apiRouter.post('/create-order', paymentLimiter, async (req, res) => {
  let createdPaymentId: string | undefined;
  let registrationId: string | undefined;
  try {
    const parsed = createOrderInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Identificadores de inscrição ou tentativa inválidos.' });
      return;
    }
    const { registration_id, attempt_id } = parsed.data;

    // 1. Idempotency check: verify attempt_id -> order_nsu
    const existingPayment = db.findPaymentByAttemptId(attempt_id);
    if (existingPayment) {
      if (existingPayment.registration_id !== registration_id) {
        res.status(409).json({ error: 'Identificador de tentativa já utilizado.' });
        return;
      }
      res.json({
        order_nsu: existingPayment.order_nsu,
        checkout_url: existingPayment.checkout_url,
        amount: existingPayment.amount,
        status: existingPayment.status,
      });
      return;
    }

    // 2. Lookup registration
    const registration = db.getRegistrationById(registration_id);
    if (!registration) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }

    if (registration.status === 'confirmed') {
      res.status(400).json({ error: 'Esta inscrição já foi paga e confirmada.' });
      return;
    }
    registrationId = registration.id;

    // 3. Generate cryptographic order_nsu & 32-byte webhook token
    const order_nsu = generateUUID();
    const { rawToken, tokenHash } = InfinitePayProvider.generateWebhookToken();

    // 4. Create payment record in DB BEFORE external call (Rule 39)
    const payment = db.createPayment({
      registration_id: registration.id,
      provider: 'infinitepay',
      attempt_id,
      order_nsu,
      status: 'pending',
      amount: registration.amount, // Snapshot from registration
      checkout_url: '',
      webhook_token_hash: tokenHash,
    });
    createdPaymentId = payment.id;

    // 5. Build return URL
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = getAppUrl() || `${protocol}://${host}`;
    const returnUrl = `${baseUrl}/pagamento/processando?order_nsu=${order_nsu}`;
    const webhookUrl = `${baseUrl}/api/webhook/infinitepay?token=${encodeURIComponent(rawToken)}`;

    // 6. Call InfinitePay provider
    const linkResult = await infinitePayProvider.createPaymentLink({
      orderNsu: order_nsu,
      attemptId: attempt_id,
      amountCents: registration.amount,
      webhookToken: rawToken,
      registrationPublicCode: registration.public_code,
      returnUrl,
      webhookUrl,
    });

    // 7. Update payment record with checkout URL & invoice slug
    db.updatePayment(payment.id, {
      checkout_url: linkResult.checkoutUrl,
      invoice_slug: linkResult.invoiceSlug,
      status: 'processing',
    });

    // Update registration status to processing_payment
    db.updateRegistrationStatus(registration.id, 'processing_payment');

    res.json({
      order_nsu,
      checkout_url: linkResult.checkoutUrl,
      attempt_id,
      amount: registration.amount,
      status: 'processing',
    });
  } catch (err: any) {
    console.error('Error in /api/create-order:', err);
    if (createdPaymentId) {
      db.updatePayment(createdPaymentId, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Falha ao criar checkout',
      });
    }
    if (registrationId) {
      db.updateRegistrationStatus(registrationId, 'payment_failed');
    }
    const providerRejected =
      err instanceof Error && err.message.startsWith('InfinitePay recusou a criação do checkout:');
    res.status(providerRejected ? 502 : 500).json({
      error: providerRejected
        ? 'A InfinitePay recusou o checkout. Verifique a InfiniteTag e se o Checkout Integrado está habilitado na conta.'
        : 'Erro ao gerar ordem de pagamento',
    });
  }
});

/**
 * GET /api/order-status
 * Safe public status inquiry
 */
apiRouter.get('/order-status', (req, res) => {
  try {
    const orderNsu = req.query.order_nsu as string;
    const publicCode = req.query.public_code as string;

    let payment;
    let registration;

    if (orderNsu) {
      payment = db.findPaymentByOrderNsu(orderNsu);
      if (payment) {
        registration = db.getRegistrationById(payment.registration_id);
      }
    } else if (publicCode) {
      registration = db.getRegistrationByPublicCode(publicCode);
      if (registration) {
        payment = db.getPaymentByRegistrationId(registration.id);
      }
    }

    if (!registration) {
      res.status(404).json({ error: 'Ordem ou inscrição não encontrada' });
      return;
    }

    res.json({
      order_nsu: payment?.order_nsu,
      public_code: registration.public_code,
      status: registration.status,
      paid: registration.status === 'confirmed',
      participant_name: registration.participant_name,
      class_label: registration.class_label_snapshot,
      shirt_size_code: registration.shirt_size_code_snapshot,
      shirt_category: registration.shirt_category_snapshot,
      width_cm: registration.shirt_width_cm_snapshot,
      length_cm: registration.shirt_length_cm_snapshot,
      amount: registration.amount,
      paid_at: registration.confirmed_at || payment?.paid_at,
      receipt_url: payment?.receipt_url,
      capture_method: payment?.capture_method,
      installments: payment?.installments,
      transaction_nsu: payment?.transaction_nsu,
    });
  } catch (err: any) {
    console.error('Error in /api/order-status:', err);
    res.status(500).json({ error: 'Erro ao consultar status' });
  }
});

/**
 * POST /api/payment-check
 * Consults provider server-side and calls confirmPayment if verified
 */
apiRouter.post('/payment-check', paymentLimiter, async (req, res) => {
  try {
    const parsed = paymentCheckInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Identificadores do pagamento inválidos.' });
      return;
    }
    const { order_nsu, transaction_nsu, invoice_slug } = parsed.data;

    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(404).json({ error: 'Pagamento não encontrado' });
      return;
    }

    // If already confirmed in DB
    if (payment.status === 'paid') {
      const reg = db.getRegistrationById(payment.registration_id);
      res.json({
        success: true,
        paid: true,
        status: 'confirmed',
        registration: reg,
      });
      return;
    }

    if (invoice_slug && !payment.invoice_slug) {
      db.updatePayment(payment.id, { invoice_slug: String(invoice_slug) });
    }

    // Consult provider server-side
    const checkResult = await infinitePayProvider.checkPayment(order_nsu, payment, {
      transactionNsu: transaction_nsu ? String(transaction_nsu) : undefined,
      invoiceSlug: invoice_slug ? String(invoice_slug) : undefined,
    });

    if (checkResult.success && checkResult.paid) {
      // Validate amount
      if (checkResult.paidAmount === payment.amount) {
        const confirmResult = confirmPayment({
          orderNsu: order_nsu,
          transactionNsu: checkResult.transactionNsu || `TRX-${Date.now()}`,
          paidAmount: checkResult.paidAmount,
          captureMethod: checkResult.captureMethod,
          installments: checkResult.installments,
          receiptUrl: checkResult.receiptUrl,
        });

        res.json({
          success: confirmResult.success,
          paid: confirmResult.success,
          status: confirmResult.success ? 'confirmed' : 'failed',
          error: confirmResult.error,
          registration: confirmResult.registration,
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          paid: false,
          error: 'Valor pago diverge do valor da inscrição',
        });
        return;
      }
    }

    res.json({
      success: true,
      paid: false,
      status: payment.status,
    });
  } catch (err: any) {
    console.error('Error in /api/payment-check:', err);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

/**
 * POST /api/webhook/infinitepay
 * Official webhook receiver
 */
apiRouter.post('/webhook/infinitepay', (req, res) => {
  try {
    const { order_nsu, amount, transaction_nsu, capture_method, installments, receipt_url, invoice_slug } = req.body;
    const token = String(req.query.token || '');

    if (!order_nsu || !token || !transaction_nsu) {
      res.status(400).json({ error: 'Parâmetros incompletos no webhook' });
      return;
    }

    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(404).json({ error: 'Pagamento não encontrado' });
      return;
    }

    // Token validation: SHA-256(incoming token) === payment.webhook_token_hash
    const calculatedHash = crypto.createHash('sha256').update(token).digest();
    const expectedHash = Buffer.from(payment.webhook_token_hash, 'hex');
    if (calculatedHash.length !== expectedHash.length || !crypto.timingSafeEqual(calculatedHash, expectedHash)) {
      console.warn('Webhook token verification failed for order_nsu:', order_nsu);
      res.status(401).json({ error: 'Token de webhook inválido' });
      return;
    }

    // Amount validation (Rule 43)
    const paidAmount = Number(amount);
    if (paidAmount !== payment.amount) {
      console.error(`Webhook amount divergence: expected ${payment.amount}, received ${paidAmount}`);
      res.status(400).json({ error: 'Valor da notificação diverge do esperado' });
      return;
    }

    if (invoice_slug) {
      db.updatePayment(payment.id, { invoice_slug: String(invoice_slug) });
    }

    // Central confirmation
    const result = confirmPayment({
      orderNsu: order_nsu,
      transactionNsu: String(transaction_nsu),
      paidAmount,
      captureMethod: capture_method,
      installments: Number(installments) || 1,
      receiptUrl: receipt_url,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ status: 'success', message: 'Pagamento processado com sucesso' });
  } catch (err: any) {
    console.error('Error in /api/webhook/infinitepay:', err);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * POST /api/sandbox/simulate-payment
 * Interactive testing gateway to test PIX/Card approval in preview
 */
apiRouter.post('/sandbox/simulate-payment', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' || infinitePayProvider.getMode() !== 'sandbox') {
      res.status(404).json({ error: 'Rota não disponível' });
      return;
    }
    const { order_nsu, token, capture_method = 'pix' } = req.body;

    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(404).json({ error: 'Ordem de pagamento não encontrada' });
      return;
    }

    // If token is provided, verify it
    if (token) {
      const calculatedHash = crypto.createHash('sha256').update(token).digest('hex');
      if (calculatedHash !== payment.webhook_token_hash) {
        res.status(401).json({ error: 'Token de checkout inválido' });
        return;
      }
    }

    const transactionNsu = `NSU-INF-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = confirmPayment({
      orderNsu: order_nsu,
      transactionNsu,
      paidAmount: payment.amount,
      captureMethod: capture_method,
      installments: 1,
      receiptUrl: `https://recibo.infinitepay.io/${transactionNsu}`,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      message: 'Pagamento aprovado com sucesso via InfinitePay',
      transaction_nsu: transactionNsu,
      registration: result.registration,
    });
  } catch (err: any) {
    console.error('Error in /api/sandbox/simulate-payment:', err);
    res.status(500).json({ error: 'Erro na simulação do pagamento' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Protected)
// ==========================================

/**
 * POST /api/admin/login
 */
apiRouter.post('/admin/login', loginLimiter, (req, res) => {
  try {
    const parsed = loginInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      return;
    }
    const { username, password } = parsed.data;

    const admin = db.findAdminByUsername(username);
    if (!admin) {
      res.status(401).json({ error: 'Usuário ou senha incorretos' });
      return;
    }

    if (!verifyPassword(password, admin.password_hash)) {
      res.status(401).json({ error: 'Usuário ou senha incorretos' });
      return;
    }

    const token = createAdminToken(admin.id);

    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/login:', err);
    res.status(500).json({ error: 'Erro no login' });
  }
});

/**
 * POST /api/admin/logout
 */
apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true });
});

/**
 * GET /api/admin/me
 */
apiRouter.get('/admin/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.adminUser });
});

/**
 * GET /api/admin/dashboard
 */
apiRouter.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  try {
    const regs = db.getRegistrations();
    const payments = db.getAllData().payments;

    const confirmedRegs = regs.filter((r) => r.status === 'confirmed');
    const pendingRegs = regs.filter((r) => r.status === 'pending_payment' || r.status === 'processing_payment');
    const failedRegs = regs.filter((r) => r.status === 'payment_failed');

    const todayStr = new Date().toISOString().split('T')[0];
    const regsToday = regs.filter((r) => r.created_at.startsWith(todayStr));

    const totalRevenueCents = confirmedRegs.reduce((sum, r) => sum + r.amount, 0);
    const totalConfirmedShirts = confirmedRegs.length; // Each registration is 1 shirt

    res.json({
      total_confirmed: confirmedRegs.length,
      waiting_payment: pendingRegs.length,
      registrations_today: regsToday.length,
      total_revenue_cents: totalRevenueCents,
      total_confirmed_shirts: totalConfirmedShirts,
      payment_issues: failedRegs.length,
      recent_registrations: regs.slice(0, 10).map((r) => ({
        ...r,
        payment: payments.find((p) => p.registration_id === r.id),
      })),
    });
  } catch (err: any) {
    console.error('Error in /api/admin/dashboard:', err);
    res.status(500).json({ error: 'Erro ao gerar dados do dashboard' });
  }
});

/**
 * GET /api/admin/registrations
 * Filterable list
 */
apiRouter.get('/admin/registrations', requireAdminAuth, (req, res) => {
  try {
    const {
      search,
      unit,
      class_id,
      category,
      size_id,
      status,
      start_date,
      end_date,
    } = req.query as Record<string, string | undefined>;

    let list = db.getRegistrations();
    const payments = db.getAllData().payments;

    // Search by code, participant_name, or class label
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.public_code.toLowerCase().includes(q) ||
          r.participant_name.toLowerCase().includes(q) ||
          r.class_label_snapshot.toLowerCase().includes(q)
      );
    }

    if (status) {
      list = list.filter((r) => r.status === status);
    }

    if (class_id) {
      list = list.filter((r) => r.class_id === class_id);
    }

    if (unit) {
      list = list.filter((r) => r.class_label_snapshot.toLowerCase().includes(unit.toLowerCase()));
    }

    if (category) {
      list = list.filter((r) => r.shirt_category_snapshot === category);
    }

    if (size_id) {
      list = list.filter((r) => r.shirt_size_id === size_id);
    }

    if (start_date) {
      list = list.filter((r) => r.created_at >= start_date);
    }

    if (end_date) {
      list = list.filter((r) => r.created_at <= `${end_date}T23:59:59.999Z`);
    }

    const total = list.length;
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '25', 10)));
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    const items = paginated.map((r) => {
      const payment = payments.find((p) => p.registration_id === r.id);
      return {
        ...r,
        payment_status: payment?.status || 'none',
        transaction_nsu: payment?.transaction_nsu,
        capture_method: payment?.capture_method,
      };
    });

    res.json({
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error('Error in /api/admin/registrations:', err);
    res.status(500).json({ error: 'Erro ao listar inscrições' });
  }
});

/**
 * GET /api/admin/registrations/:id
 */
apiRouter.get('/admin/registrations/:id', requireAdminAuth, (req, res) => {
  try {
    const item = db.getRegistrationWithDetails(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    console.error('Error in /api/admin/registrations/:id:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes da inscrição' });
  }
});

/**
 * GET /api/admin/camisas
 * Report grouped by size, category, class, and unit
 */
apiRouter.get('/admin/camisas', requireAdminAuth, (req, res) => {
  try {
    const onlyConfirmed = req.query.all !== 'true';
    let regs = db.getRegistrations();
    if (onlyConfirmed) {
      regs = regs.filter((r) => r.status === 'confirmed');
    }

    const sizes = db.getShirtSizes(false);

    // Group by size code
    const bySize: Record<string, { code: string; name: string; category: string; count: number; width_cm: number; length_cm: number }> = {};
    for (const s of sizes) {
      bySize[s.code] = {
        code: s.code,
        name: s.name,
        category: s.category,
        width_cm: s.width_cm,
        length_cm: s.length_cm,
        count: 0,
      };
    }

    // Group by class
    const byClass: Record<string, { label: string; count: number }> = {};
    // Group by unit
    const byUnit: Record<string, { unit: string; count: number }> = {};

    let totalAdult = 0;
    let totalChild = 0;

    for (const r of regs) {
      const code = r.shirt_size_code_snapshot;
      if (!bySize[code]) {
        bySize[code] = {
          code,
          name: code,
          category: r.shirt_category_snapshot,
          width_cm: r.shirt_width_cm_snapshot,
          length_cm: r.shirt_length_cm_snapshot,
          count: 0,
        };
      }
      bySize[code].count += 1;

      if (r.shirt_category_snapshot === 'adult') {
        totalAdult += 1;
      } else {
        totalChild += 1;
      }

      // Class
      const classLabel = r.class_label_snapshot;
      byClass[classLabel] = byClass[classLabel] || { label: classLabel, count: 0 };
      byClass[classLabel].count += 1;

      // Extract unit name
      const unitMatch = classLabel.match(/UNIDADE\s+([^-]+)/i);
      const unitName = unitMatch ? unitMatch[1].trim() : 'Outras';
      byUnit[unitName] = byUnit[unitName] || { unit: unitName, count: 0 };
      byUnit[unitName].count += 1;
    }

    res.json({
      total_shirts: regs.length,
      total_adult: totalAdult,
      total_child: totalChild,
      by_size: Object.values(bySize).sort((a, b) => {
        const sizeA = sizes.find((s) => s.code === a.code);
        const sizeB = sizes.find((s) => s.code === b.code);
        return (sizeA?.sort_order || 99) - (sizeB?.sort_order || 99);
      }),
      by_class: Object.values(byClass).sort((a, b) => b.count - a.count),
      by_unit: Object.values(byUnit).sort((a, b) => b.count - a.count),
    });
  } catch (err: any) {
    console.error('Error in /api/admin/camisas:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório de camisetas' });
  }
});

/**
 * GET /api/admin/export
 * Dynamic CSV export containing all system fields and dynamic answers
 */
apiRouter.get('/api/admin/export', requireAdminAuth, (req, res) => {
  try {
    const regs = db.getRegistrations();
    const allAnswers = db.getAllData().registration_answers;
    const payments = db.getAllData().payments;

    // Collect all dynamic question labels used across history
    const customLabelsSet = new Set<string>();
    for (const ans of allAnswers) {
      if (
        ans.field_key_snapshot !== 'full_name' &&
        ans.field_key_snapshot !== 'class_id' &&
        ans.field_key_snapshot !== 'shirt_size_id'
      ) {
        customLabelsSet.add(ans.label_snapshot);
      }
    }
    const customLabels = Array.from(customLabelsSet);

    // Build CSV Headers
    const headers = [
      'Código',
      'Status',
      'Data Inscrição',
      'Nome Completo',
      'Unidade/Turma',
      'Tamanho Camiseta',
      'Categoria',
      'Largura (cm)',
      'Comprimento (cm)',
      'Qtd',
      'Valor (R$)',
      'Situação Pagamento',
      'NSU Transação',
      'Forma Pagamento',
      'Data Pagamento',
      'Comprovante',
      ...customLabels,
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = regs.map((r) => {
      const regAnswers = allAnswers.filter((a) => a.registration_id === r.id);
      const payment = payments.find((p) => p.registration_id === r.id);

      const statusMap: Record<RegistrationStatus, string> = {
        confirmed: 'Confirmada',
        pending_payment: 'Aguardando Pagamento',
        processing_payment: 'Processando Pagamento',
        payment_failed: 'Falha no Pagamento',
        expired: 'Expirada',
        cancelled: 'Cancelada',
      };

      const dateStr = new Date(r.created_at).toLocaleString('pt-BR');
      const paidDateStr = payment?.paid_at ? new Date(payment.paid_at).toLocaleString('pt-BR') : '';

      const rowValues = [
        r.public_code,
        statusMap[r.status] || r.status,
        dateStr,
        r.participant_name,
        r.class_label_snapshot,
        r.shirt_size_code_snapshot,
        r.shirt_category_snapshot === 'adult' ? 'Adulto' : 'Infantil',
        r.shirt_width_cm_snapshot,
        r.shirt_length_cm_snapshot,
        1,
        (r.amount / 100).toFixed(2).replace('.', ','),
        payment?.status === 'paid' ? 'Pago' : payment?.status || 'Pendente',
        payment?.transaction_nsu || '',
        payment?.capture_method || '',
        paidDateStr,
        payment?.receipt_url || '',
      ];

      // Custom answer columns
      for (const label of customLabels) {
        const found = regAnswers.find((a) => a.label_snapshot === label);
        rowValues.push(found ? found.value : '');
      }

      return rowValues.map(escapeCSV).join(';');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inscricoes-ultra-volleyball.csv"');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Erro ao gerar exportação' });
  }
});

// Also alias /api/admin/export directly on apiRouter:
apiRouter.get('/admin/export', requireAdminAuth, (req, res) => {
  // forward to the same export handler above
  const regs = db.getRegistrations();
  const allAnswers = db.getAllData().registration_answers;
  const payments = db.getAllData().payments;

  const customLabelsSet = new Set<string>();
  for (const ans of allAnswers) {
    if (
      ans.field_key_snapshot !== 'full_name' &&
      ans.field_key_snapshot !== 'class_id' &&
      ans.field_key_snapshot !== 'shirt_size_id'
    ) {
      customLabelsSet.add(ans.label_snapshot);
    }
  }
  const customLabels = Array.from(customLabelsSet);

  const headers = [
    'Código',
    'Status',
    'Data Inscrição',
    'Nome Completo',
    'Unidade/Turma',
    'Tamanho Camiseta',
    'Categoria',
    'Largura (cm)',
    'Comprimento (cm)',
    'Qtd',
    'Valor (R$)',
    'Situação Pagamento',
    'NSU Transação',
    'Forma Pagamento',
    'Data Pagamento',
    'Comprovante',
    ...customLabels,
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = regs.map((r) => {
    const regAnswers = allAnswers.filter((a) => a.registration_id === r.id);
    const payment = payments.find((p) => p.registration_id === r.id);

    const statusMap: Record<RegistrationStatus, string> = {
      confirmed: 'Confirmada',
      pending_payment: 'Aguardando Pagamento',
      processing_payment: 'Processando Pagamento',
      payment_failed: 'Falha no Pagamento',
      expired: 'Expirada',
      cancelled: 'Cancelada',
    };

    const dateStr = new Date(r.created_at).toLocaleString('pt-BR');
    const paidDateStr = payment?.paid_at ? new Date(payment.paid_at).toLocaleString('pt-BR') : '';

    const rowValues = [
      r.public_code,
      statusMap[r.status] || r.status,
      dateStr,
      r.participant_name,
      r.class_label_snapshot,
      r.shirt_size_code_snapshot,
      r.shirt_category_snapshot === 'adult' ? 'Adulto' : 'Infantil',
      r.shirt_width_cm_snapshot,
      r.shirt_length_cm_snapshot,
      1,
      (r.amount / 100).toFixed(2).replace('.', ','),
      payment?.status === 'paid' ? 'Pago' : payment?.status || 'Pendente',
      payment?.transaction_nsu || '',
      payment?.capture_method || '',
      paidDateStr,
      payment?.receipt_url || '',
    ];

    for (const label of customLabels) {
      const found = regAnswers.find((a) => a.label_snapshot === label);
      rowValues.push(found ? found.value : '');
    }

    return rowValues.map(escapeCSV).join(';');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inscricoes-ultra-volleyball.csv"');
  res.send(csvContent);
});

/**
 * Form Fields Management
 */
apiRouter.get('/admin/form-fields', requireAdminAuth, (req, res) => {
  res.json(db.getFormFields(false));
});

apiRouter.post('/admin/form-fields', requireAdminAuth, (req, res) => {
  try {
    const { label, description, field_type, placeholder, required, options } = req.body;
    if (!label || !field_type) {
      res.status(400).json({ error: 'Pergunta e tipo são obrigatórios' });
      return;
    }

    const key = `custom_${Date.now()}_${label.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15)}`;
    const count = db.getFormFields(false).length;

    const newField = db.createFormField({
      key,
      label,
      description: description || '',
      field_type,
      placeholder: placeholder || '',
      required: Boolean(required),
      active: true,
      sort_order: count + 1,
      options: Array.isArray(options) ? options : [],
    });

    res.status(201).json(newField);
  } catch (err: any) {
    console.error('Error creating form field:', err);
    res.status(500).json({ error: 'Erro ao criar pergunta' });
  }
});

apiRouter.put('/admin/form-fields/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateFormField(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Pergunta não encontrada' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating form field:', err);
    res.status(500).json({ error: 'Erro ao atualizar pergunta' });
  }
});

apiRouter.post('/admin/form-fields/reorder', requireAdminAuth, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'Array de IDs inválido' });
      return;
    }
    db.reorderFormFields(ids);
    res.json(db.getFormFields(false));
  } catch (err: any) {
    console.error('Error reordering fields:', err);
    res.status(500).json({ error: 'Erro ao reordenar campos' });
  }
});

/**
 * Classes Management
 */
apiRouter.get('/admin/classes', requireAdminAuth, (req, res) => {
  res.json(db.getClasses(false));
});

apiRouter.post('/admin/classes', requireAdminAuth, (req, res) => {
  try {
    const { display_label, unit, category, gender, level, weekday, start_time } = req.body;
    if (!display_label) {
      res.status(400).json({ error: 'Nome/descrição da turma é obrigatório' });
      return;
    }

    const count = db.getClasses(false).length;
    const newClass = db.createClass({
      display_label,
      unit: unit || 'GERAL',
      category: category || 'GERAL',
      gender: gender || 'MISTO',
      level: level || 'GERAL',
      weekday: weekday || '',
      start_time: start_time || '',
      active: true,
      sort_order: count + 1,
    });

    res.status(201).json(newClass);
  } catch (err: any) {
    console.error('Error creating class:', err);
    res.status(500).json({ error: 'Erro ao criar turma' });
  }
});

apiRouter.put('/admin/classes/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateClass(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Turma não encontrada' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating class:', err);
    res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
});

/**
 * Shirt Sizes Management
 */
apiRouter.get('/admin/shirt-sizes', requireAdminAuth, (req, res) => {
  res.json(db.getShirtSizes(false));
});

apiRouter.post('/admin/shirt-sizes', requireAdminAuth, (req, res) => {
  try {
    const { code, name, width_cm, length_cm, category } = req.body;
    if (!code || !width_cm || !length_cm || !category) {
      res.status(400).json({ error: 'Código, largura, comprimento e categoria são obrigatórios' });
      return;
    }

    const count = db.getShirtSizes(false).length;
    const newSize = db.createShirtSize({
      code,
      name: name || `${code} ${category === 'adult' ? 'Adulto' : 'Infantil'}`,
      width_cm: Number(width_cm),
      length_cm: Number(length_cm),
      category: category === 'child' ? 'child' : 'adult',
      active: true,
      sort_order: count + 1,
    });

    res.status(201).json(newSize);
  } catch (err: any) {
    console.error('Error creating shirt size:', err);
    res.status(500).json({ error: 'Erro ao criar tamanho' });
  }
});

apiRouter.put('/admin/shirt-sizes/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateShirtSize(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Tamanho não encontrado' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating shirt size:', err);
    res.status(500).json({ error: 'Erro ao atualizar tamanho' });
  }
});

/**
 * Settings Management (Price, Password & InfinitePay)
 */
apiRouter.get('/admin/settings', requireAdminAuth, (req, res) => {
  res.json({
    shirt_price: db.getShirtPrice(),
    infinitepay_handle: db.getSetting('infinitepay_handle', process.env.INFINITEPAY_HANDLE || ''),
    infinitepay_mode: db.getSetting('infinitepay_mode', 'production'),
  });
});

apiRouter.put('/admin/settings/infinitepay', requireAdminAuth, (req, res) => {
  try {
    const { handle, mode } = req.body;
    if (handle !== undefined) {
      const cleanHandle = String(handle).replace('$', '').trim();
      db.setSetting('infinitepay_handle', cleanHandle);
    }
    if (mode && (mode === 'production' || mode === 'sandbox')) {
      if (process.env.NODE_ENV === 'production' && mode !== 'production') {
        res.status(400).json({ error: 'O modo sandbox não pode ser ativado em produção.' });
        return;
      }
      db.setSetting('infinitepay_mode', mode);
    }

    res.json({
      success: true,
      infinitepay_handle: db.getSetting('infinitepay_handle', process.env.INFINITEPAY_HANDLE || ''),
      infinitepay_mode: db.getSetting('infinitepay_mode', 'production'),
    });
  } catch (err: any) {
    console.error('Error updating InfinitePay settings:', err);
    res.status(500).json({ error: 'Erro ao atualizar configurações InfinitePay' });
  }
});

/**
 * Manual confirmation from Admin Detail view
 */
apiRouter.post('/admin/registrations/:id/confirm-payment', requireAdminAuth, (req, res) => {
  try {
    const { transaction_nsu, capture_method = 'pix' } = req.body;
    const reg = db.getRegistrationById(req.params.id);
    if (!reg) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }

    let payment = db.getPaymentByRegistrationId(reg.id);
    if (!payment) {
      const order_nsu = generateUUID();
      payment = db.createPayment({
        registration_id: reg.id,
        provider: 'infinitepay',
        attempt_id: `manual_${Date.now()}`,
        order_nsu,
        status: 'pending',
        amount: reg.amount,
        checkout_url: '',
        webhook_token_hash: '',
      });
    }

    const nsu = transaction_nsu || `MANUAL-${Date.now()}`;
    const result = confirmPayment({
      orderNsu: payment.order_nsu,
      transactionNsu: nsu,
      paidAmount: reg.amount,
      captureMethod: capture_method,
      installments: 1,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      message: 'Inscrição e pagamento confirmados manualmente com sucesso.',
      registration: result.registration,
    });
  } catch (err: any) {
    console.error('Error confirming payment manually:', err);
    res.status(500).json({ error: 'Erro ao confirmar pagamento manualmente' });
  }
});

apiRouter.put('/admin/settings/price', requireAdminAuth, (req, res) => {
  try {
    const { shirt_price } = req.body;
    const priceCents = parseInt(shirt_price, 10);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      res.status(400).json({ error: 'Valor da camiseta inválido (deve ser em centavos positivos).' });
      return;
    }

    db.setSetting('shirt_price', String(priceCents));
    res.json({
      success: true,
      shirt_price: priceCents,
      formatted: `R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`,
    });
  } catch (err: any) {
    console.error('Error setting shirt price:', err);
    res.status(500).json({ error: 'Erro ao atualizar valor da camiseta' });
  }
});

apiRouter.put('/admin/settings/password', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 12) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 12 caracteres.' });
      return;
    }

    const admin = db.findAdminById(req.adminUser!.id);
    if (!admin) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (!verifyPassword(current_password, admin.password_hash)) {
      res.status(400).json({ error: 'Senha atual incorreta' });
      return;
    }

    db.updateAdminPassword(admin.id, hashPassword(new_password));
    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (err: any) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});
