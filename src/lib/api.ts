import type {
  ClassItem,
  FormField,
  PublicFormConfig,
  Registration,
  RegistrationWithDetails,
  ShirtSize,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readJsonResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const body = await res.text();
  let result: any;

  try {
    result = body ? JSON.parse(body) : undefined;
  } catch {
    throw new ApiError(`${fallbackMessage} (HTTP ${res.status}: resposta inválida do servidor)`, res.status);
  }

  if (!res.ok) {
    throw new ApiError(
      result?.error || result?.message || `${fallbackMessage} (HTTP ${res.status})`,
      res.status,
      result?.code
    );
  }
  if (result === undefined) {
    throw new ApiError(`${fallbackMessage} (HTTP ${res.status}: resposta vazia do servidor)`, res.status);
  }

  return result as T;
}

export const api = {
  // Public
  async getPublicConfig(): Promise<PublicFormConfig> {
    const res = await fetch('/api/public-config');
    return readJsonResponse<PublicFormConfig>(res, 'Falha ao carregar configurações');
  },

  async createRegistration(data: {
    attempt_id?: string;
    full_name: string;
    class_id: string;
    shirt_size_id: string;
    dynamic_answers: Record<string, any>;
  }) {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return readJsonResponse<any>(res, 'Erro ao criar inscrição');
  },

  async createOrder(registration_id: string, attempt_id: string) {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id, attempt_id }),
    });
    return readJsonResponse<any>(res, 'Erro ao gerar ordem de pagamento');
  },

  async getOrderStatus(order_nsu?: string, public_code?: string) {
    const params = new URLSearchParams();
    if (order_nsu) params.set('order_nsu', order_nsu);
    if (public_code) params.set('public_code', public_code);

    const res = await fetch(`/api/order-status?${params.toString()}`);
    return readJsonResponse<any>(res, 'Erro ao consultar status');
  },

  async checkPayment(order_nsu: string, transaction_nsu?: string, invoice_slug?: string) {
    const res = await fetch('/api/payment-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_nsu, transaction_nsu, invoice_slug }),
    });
    return readJsonResponse<any>(res, 'Erro ao verificar pagamento');
  },

  async simulateSandboxPayment(order_nsu: string, token?: string, capture_method = 'pix') {
    const res = await fetch('/api/sandbox/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_nsu, token, capture_method }),
    });
    return readJsonResponse<any>(res, 'Erro ao simular pagamento');
  },

  // Admin
  async adminLogin(username: string, password: string) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return readJsonResponse<any>(res, 'Não foi possível acessar o painel administrativo');
  },

  async adminLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
  },

  getAuthHeaders(): HeadersInit {
    return {};
  },

  async getAdminMe() {
    const res = await fetch('/api/admin/me', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Não autenticado');
    return res.json();
  },

  async getAdminDashboard() {
    const res = await fetch('/api/admin/dashboard', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar dashboard');
    return res.json();
  },

  async getAdminRegistrations(query: Record<string, string> = {}) {
    const params = new URLSearchParams(query);
    const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar inscrições');
    return res.json();
  },

  async getAdminRegistrationDetail(id: string): Promise<RegistrationWithDetails> {
    const res = await fetch(`/api/admin/registrations/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Inscrição não encontrada');
    return res.json();
  },

  async getAdminShirtsReport(all = false) {
    const res = await fetch(`/api/admin/camisas?all=${all}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar relatório de camisas');
    return res.json();
  },

  async downloadAdminExport() {
    const res = await fetch('/api/admin/export');
    if (!res.ok) throw new Error('Falha ao exportar inscrições');
    return res.blob();
  },

  async getAdminFormFields(): Promise<FormField[]> {
    const res = await fetch('/api/admin/form-fields', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar perguntas');
    return res.json();
  },

  async createFormField(field: Partial<FormField>) {
    const res = await fetch('/api/admin/form-fields', {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(field),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao criar pergunta');
    return result;
  },

  async updateFormField(id: string, updates: Partial<FormField>) {
    const res = await fetch(`/api/admin/form-fields/${id}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar pergunta');
    return result;
  },

  async reorderFormFields(ids: string[]) {
    const res = await fetch('/api/admin/form-fields/reorder', {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Erro ao reordenar');
    return res.json();
  },

  async getAdminClasses(): Promise<ClassItem[]> {
    const res = await fetch('/api/admin/classes', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar turmas');
    return res.json();
  },

  async createClass(item: Partial<ClassItem>) {
    const res = await fetch('/api/admin/classes', {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao criar turma');
    return result;
  },

  async updateClass(id: string, updates: Partial<ClassItem>) {
    const res = await fetch(`/api/admin/classes/${id}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar turma');
    return result;
  },

  async getAdminShirtSizes(): Promise<ShirtSize[]> {
    const res = await fetch('/api/admin/shirt-sizes', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar tamanhos');
    return res.json();
  },

  async createShirtSize(item: Partial<ShirtSize>) {
    const res = await fetch('/api/admin/shirt-sizes', {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao criar tamanho');
    return result;
  },

  async updateShirtSize(id: string, updates: Partial<ShirtSize>) {
    const res = await fetch(`/api/admin/shirt-sizes/${id}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar tamanho');
    return result;
  },

  async getAdminSettings() {
    const res = await fetch('/api/admin/settings', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar configurações');
    return res.json();
  },

  async updateShirtPrice(shirt_price: number) {
    const res = await fetch('/api/admin/settings/price', {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ shirt_price }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar preço');
    return result;
  },

  async updatePassword(current_password: string, new_password: string) {
    const res = await fetch('/api/admin/settings/password', {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password, new_password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar senha');
    return result;
  },
  async updateInfinitePaySettings(handle: string, mode: 'production' | 'sandbox') {
    const res = await fetch('/api/admin/settings/infinitepay', {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, mode }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar configurações da InfinitePay');
    return result;
  },

  async confirmRegistrationPaymentManually(id: string, transaction_nsu?: string) {
    const res = await fetch(`/api/admin/registrations/${id}/confirm-payment`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_nsu }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao confirmar pagamento manualmente');
    return result;
  },
};
