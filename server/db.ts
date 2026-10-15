import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type {
  AdminUser,
  ClassItem,
  FormField,
  Payment,
  Registration,
  RegistrationAnswer,
  ShirtSize,
  SystemSettings,
} from '../src/types';

export interface DatabaseSchema {
  system_settings: SystemSettings[];
  classes: ClassItem[];
  shirt_sizes: ShirtSize[];
  form_fields: FormField[];
  registrations: Registration[];
  registration_answers: RegistrationAnswer[];
  payments: Payment[];
  admin_users: AdminUser[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ultra_db.json');

function usesManagedDatabase(): boolean {
  return Boolean(
    process.env.NETLIFY ||
      process.env.NETLIFY_DB_URL ||
      process.env.CONTEXT ||
      process.env.DEPLOY_ID ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
  );
}

// Initial seed data
const INITIAL_CLASSES: Omit<ClassItem, 'id' | 'created_at' | 'updated_at'>[] = [
  { display_label: 'UNIDADE BATALHA - INFANTIL SEGUNDA 09HS', unit: 'BATALHA', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'SEGUNDA', start_time: '09:00', active: true, sort_order: 1 },
  { display_label: 'UNIDADE BATALHA - INFANTIL SEGUNDA 13:30HS', unit: 'BATALHA', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'SEGUNDA', start_time: '13:30', active: true, sort_order: 2 },
  { display_label: 'UNIDADE BATALHA - INFANTIL QUARTA 09HS', unit: 'BATALHA', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'QUARTA', start_time: '09:00', active: true, sort_order: 3 },
  { display_label: 'UNIDADE BATALHA - INFANTIL QUARTA 13:30HS', unit: 'BATALHA', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'QUARTA', start_time: '13:30', active: true, sort_order: 4 },
  { display_label: 'UNIDADE ITAQUERA - FEMININO QUARTA 18HS', unit: 'ITAQUERA', category: 'ADULTO', gender: 'FEMININO', level: 'INTERMEDIÁRIO', weekday: 'QUARTA', start_time: '18:00', active: true, sort_order: 5 },
  { display_label: 'UNIDADE ITAQUERA - MISTO QUARTA 20HS', unit: 'ITAQUERA', category: 'ADULTO', gender: 'MISTO', level: 'GERAL', weekday: 'QUARTA', start_time: '20:00', active: true, sort_order: 6 },
  { display_label: 'UNIDADE TATUAPÉ - INFANTIL SEGUNDA 17:30HS', unit: 'TATUAPÉ', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'SEGUNDA', start_time: '17:30', active: true, sort_order: 7 },
  { display_label: 'UNIDADE TATUAPÉ - FEMININO SEGUNDA 19HS', unit: 'TATUAPÉ', category: 'ADULTO', gender: 'FEMININO', level: 'INTERMEDIÁRIO', weekday: 'SEGUNDA', start_time: '19:00', active: true, sort_order: 8 },
  { display_label: 'UNIDADE VILA MATILDE - MASCULINO AVANÇADO', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'MASCULINO', level: 'AVANÇADO', weekday: 'SEGUNDA/QUARTA', start_time: '20:30', active: true, sort_order: 9 },
  { display_label: 'UNIDADE VILA MATILDE - FEMININO AVANÇADO', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'FEMININO', level: 'AVANÇADO', weekday: 'TERÇA/QUINTA', start_time: '20:30', active: true, sort_order: 10 },
  { display_label: 'UNIDADE VILA MATILDE - FEMININO TERÇA 17HS', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'FEMININO', level: 'INTERMEDIÁRIO', weekday: 'TERÇA', start_time: '17:00', active: true, sort_order: 11 },
  { display_label: 'UNIDADE VILA MATILDE - MASCULINO QUARTA 17:30', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'MASCULINO', level: 'INTERMEDIÁRIO', weekday: 'QUARTA', start_time: '17:30', active: true, sort_order: 12 },
  { display_label: 'UNIDADE VILA MATILDE - INFANTIL QUINTA 09HS', unit: 'VILA MATILDE', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'QUINTA', start_time: '09:00', active: true, sort_order: 13 },
  { display_label: 'UNIDADE VILA MATILDE - INFANTIL QUINTA 14HS', unit: 'VILA MATILDE', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'QUINTA', start_time: '14:00', active: true, sort_order: 14 },
  { display_label: 'UNIDADE VILA MATILDE - FEMININO QUINTA 15:30HS', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'FEMININO', level: 'GERAL', weekday: 'QUINTA', start_time: '15:30', active: true, sort_order: 15 },
  { display_label: 'UNIDADE VILA MATILDE - ADULTO QUINTA 17:30HS', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'MISTO', level: 'GERAL', weekday: 'QUINTA', start_time: '17:30', active: true, sort_order: 16 },
  { display_label: 'UNIDADE VILA MATILDE - MISTO SEXTA 14HS', unit: 'VILA MATILDE', category: 'ADULTO', gender: 'MISTO', level: 'GERAL', weekday: 'SEXTA', start_time: '14:00', active: true, sort_order: 17 },
  { display_label: 'UNIDADE VILA RÉ - INFANTIL TERÇA 18:30HS', unit: 'VILA RÉ', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'TERÇA', start_time: '18:30', active: true, sort_order: 18 },
  { display_label: 'UNIDADE VILA RÉ - MISTO TERÇA 20HS', unit: 'VILA RÉ', category: 'ADULTO', gender: 'MISTO', level: 'GERAL', weekday: 'TERÇA', start_time: '20:00', active: true, sort_order: 19 },
  { display_label: 'UNIDADE VILA RÉ - FEMININO QUINTA 15:30HS', unit: 'VILA RÉ', category: 'ADULTO', gender: 'FEMININO', level: 'GERAL', weekday: 'QUINTA', start_time: '15:30', active: true, sort_order: 20 },
  { display_label: 'UNIDADE VILA RÉ - INFANTIL QUINTA 18:30HS', unit: 'VILA RÉ', category: 'INFANTIL', gender: 'MISTO', level: 'INICIANTE', weekday: 'QUINTA', start_time: '18:30', active: true, sort_order: 21 },
  { display_label: 'UNIDADE VILA RÉ - MISTO QUINTA 20HS', unit: 'VILA RÉ', category: 'ADULTO', gender: 'MISTO', level: 'GERAL', weekday: 'QUINTA', start_time: '20:00', active: true, sort_order: 22 },
];

const INITIAL_SHIRT_SIZES: Omit<ShirtSize, 'id' | 'created_at' | 'updated_at'>[] = [
  // Adulto
  { code: 'G5', name: 'G5 Adulto', width_cm: 71.5, length_cm: 94, category: 'adult', active: true, sort_order: 1 },
  { code: 'G4', name: 'G4 Adulto', width_cm: 69, length_cm: 91, category: 'adult', active: true, sort_order: 2 },
  { code: 'G3', name: 'G3 Adulto', width_cm: 67.5, length_cm: 89, category: 'adult', active: true, sort_order: 3 },
  { code: 'G2', name: 'G2 Adulto', width_cm: 66, length_cm: 87, category: 'adult', active: true, sort_order: 4 },
  { code: 'G1', name: 'G1 Adulto', width_cm: 64, length_cm: 84, category: 'adult', active: true, sort_order: 5 },
  { code: 'GG', name: 'GG Adulto', width_cm: 62, length_cm: 81.5, category: 'adult', active: true, sort_order: 6 },
  { code: 'G', name: 'G Adulto', width_cm: 58.5, length_cm: 78.5, category: 'adult', active: true, sort_order: 7 },
  { code: 'M', name: 'M Adulto', width_cm: 53.5, length_cm: 76.5, category: 'adult', active: true, sort_order: 8 },
  { code: 'P', name: 'P Adulto', width_cm: 53, length_cm: 75, category: 'adult', active: true, sort_order: 9 },
  { code: 'PP', name: 'PP Adulto', width_cm: 50, length_cm: 72, category: 'adult', active: true, sort_order: 10 },
  // Infantil
  { code: 'G INF.', name: 'G Infantil', width_cm: 48, length_cm: 67, category: 'child', active: true, sort_order: 11 },
  { code: 'M INF.', name: 'M Infantil', width_cm: 45, length_cm: 66, category: 'child', active: true, sort_order: 12 },
  { code: 'P INF.', name: 'P Infantil', width_cm: 42, length_cm: 58, category: 'child', active: true, sort_order: 13 },
  { code: 'PP INF.', name: 'PP Infantil', width_cm: 37, length_cm: 51, category: 'child', active: true, sort_order: 14 },
  { code: 'BB', name: 'BB Bebê/Infantil', width_cm: 34, length_cm: 42, category: 'child', active: true, sort_order: 15 },
];

const INITIAL_FORM_FIELDS: Omit<FormField, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    key: 'full_name',
    label: 'Nome completo',
    description: 'Informe o nome completo do(a) ALUNO(A)',
    field_type: 'text',
    placeholder: 'Ex: Lucas Silva Oliveira',
    required: true,
    active: true,
    sort_order: 1,
    system_type: 'full_name',
  },
  {
    key: 'class_id',
    label: 'Unidade/Turma',
    description: 'Selecione a unidade e o horário onde treina',
    field_type: 'class_selector',
    placeholder: 'Selecione sua turma...',
    required: true,
    active: true,
    sort_order: 2,
    system_type: 'class_id',
  },
  {
    key: 'shirt_size_id',
    label: 'Tamanho camiseta',
    description: 'Escolha o tamanho ideal (consulte a tabela de medidas abaixo)',
    field_type: 'shirt_size_selector',
    placeholder: 'Selecione o tamanho...',
    required: true,
    active: true,
    sort_order: 3,
    system_type: 'shirt_size_id',
  },
];

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generatePublicCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ULTRA-${code}`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

class Database {
  private data: DatabaseSchema;
  private readonly managedDatabase = usesManagedDatabase();

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (!this.managedDatabase && !fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!this.managedDatabase && fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Error reading db file, re-initializing...', err);
      }
    }

    const now = new Date().toISOString();

    const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
    if (isProduction && !process.env.ADMIN_INITIAL_PASSWORD) {
      throw new Error('ADMIN_INITIAL_PASSWORD é obrigatória na primeira inicialização do banco');
    }
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(18).toString('base64url');
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.warn(`[SECURITY] Senha temporária do administrador local: ${initialPassword}`);
    }

    const seeded: DatabaseSchema = {
      system_settings: [
        {
          id: generateUUID(),
          key: 'shirt_price',
          value: '7000', // 7000 centavos = R$ 70,00
          updated_at: now,
        },
      ],
      classes: INITIAL_CLASSES.map((c) => ({
        ...c,
        id: generateUUID(),
        created_at: now,
        updated_at: now,
      })),
      shirt_sizes: INITIAL_SHIRT_SIZES.map((s) => ({
        ...s,
        id: generateUUID(),
        created_at: now,
        updated_at: now,
      })),
      form_fields: INITIAL_FORM_FIELDS.map((f) => ({
        ...f,
        id: generateUUID(),
        created_at: now,
        updated_at: now,
      })),
      registrations: [],
      registration_answers: [],
      payments: [],
      admin_users: [
        {
          id: generateUUID(),
          username: 'admin',
          password_hash: hashPassword(initialPassword),
          role: 'admin',
          name: 'Coordenador Ultra Volleyball',
          created_at: now,
        },
      ],
    };

    if (!this.managedDatabase) {
      this.saveData(seeded);
    }
    return seeded;
  }

  private saveData(data: DatabaseSchema): void {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public persist(): void {
    if (this.managedDatabase) return;
    this.saveData(this.data);
  }

  public exportData(): DatabaseSchema {
    return structuredClone(this.data);
  }

  public replaceData(data: DatabaseSchema): void {
    const requiredCollections: Array<keyof DatabaseSchema> = [
      'system_settings',
      'classes',
      'shirt_sizes',
      'form_fields',
      'registrations',
      'registration_answers',
      'payments',
      'admin_users',
    ];
    if (!requiredCollections.every((key) => Array.isArray(data?.[key]))) {
      throw new Error('Estado persistido do sistema é inválido');
    }
    this.data = structuredClone(data);
  }

  // System settings
  public getSetting(key: string, defaultValue: string = ''): string {
    const s = this.data.system_settings.find((item) => item.key === key);
    return s ? s.value : defaultValue;
  }

  public setSetting(key: string, value: string): void {
    const s = this.data.system_settings.find((item) => item.key === key);
    const now = new Date().toISOString();
    if (s) {
      s.value = value;
      s.updated_at = now;
    } else {
      this.data.system_settings.push({
        id: generateUUID(),
        key,
        value,
        updated_at: now,
      });
    }
    this.persist();
  }

  public getShirtPrice(): number {
    const val = this.getSetting('shirt_price', '7000');
    const parsed = parseInt(val, 10);
    return Number.isFinite(parsed) ? parsed : 7000;
  }

  // Classes
  public getClasses(onlyActive = true): ClassItem[] {
    const list = onlyActive ? this.data.classes.filter((c) => c.active) : this.data.classes;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }

  public getClassById(id: string): ClassItem | undefined {
    return this.data.classes.find((c) => c.id === id);
  }

  public createClass(input: Omit<ClassItem, 'id' | 'created_at' | 'updated_at'>): ClassItem {
    const now = new Date().toISOString();
    const item: ClassItem = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    };
    this.data.classes.push(item);
    this.persist();
    return item;
  }

  public updateClass(id: string, updates: Partial<ClassItem>): ClassItem | null {
    const idx = this.data.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.classes[idx] = {
      ...this.data.classes[idx],
      ...updates,
      id,
      updated_at: now,
    };
    this.persist();
    return this.data.classes[idx];
  }

  public hasRegistrationsForClass(classId: string): boolean {
    return this.data.registrations.some((r) => r.class_id === classId);
  }

  // Sizes
  public getShirtSizes(onlyActive = true): ShirtSize[] {
    const list = onlyActive ? this.data.shirt_sizes.filter((s) => s.active) : this.data.shirt_sizes;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }

  public getShirtSizeById(id: string): ShirtSize | undefined {
    return this.data.shirt_sizes.find((s) => s.id === id);
  }

  public createShirtSize(input: Omit<ShirtSize, 'id' | 'created_at' | 'updated_at'>): ShirtSize {
    const now = new Date().toISOString();
    const item: ShirtSize = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    };
    this.data.shirt_sizes.push(item);
    this.persist();
    return item;
  }

  public updateShirtSize(id: string, updates: Partial<ShirtSize>): ShirtSize | null {
    const idx = this.data.shirt_sizes.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.shirt_sizes[idx] = {
      ...this.data.shirt_sizes[idx],
      ...updates,
      id,
      updated_at: now,
    };
    this.persist();
    return this.data.shirt_sizes[idx];
  }

  // Form fields
  public getFormFields(onlyActive = true): FormField[] {
    const list = onlyActive ? this.data.form_fields.filter((f) => f.active) : this.data.form_fields;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }

  public getFormFieldById(id: string): FormField | undefined {
    return this.data.form_fields.find((f) => f.id === id);
  }

  public createFormField(input: Omit<FormField, 'id' | 'created_at' | 'updated_at'>): FormField {
    const now = new Date().toISOString();
    const item: FormField = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    };
    this.data.form_fields.push(item);
    this.persist();
    return item;
  }

  public updateFormField(id: string, updates: Partial<FormField>): FormField | null {
    const idx = this.data.form_fields.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const existing = this.data.form_fields[idx];

    // If it's a system field, protect its key, system_type, and fundamental type
    if (existing.system_type) {
      delete updates.system_type;
      delete updates.key;
      delete updates.field_type;
    }

    this.data.form_fields[idx] = {
      ...existing,
      ...updates,
      id,
      updated_at: now,
    };
    this.persist();
    return this.data.form_fields[idx];
  }

  public reorderFormFields(orderedIds: string[]): void {
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const field = this.data.form_fields.find((f) => f.id === id);
      if (field) {
        field.sort_order = index + 1;
        field.updated_at = now;
      }
    });
    this.persist();
  }

  // Registrations
  public createRegistration(
    regData: Omit<Registration, 'id' | 'public_code' | 'created_at' | 'updated_at'>,
    answers: Omit<RegistrationAnswer, 'id' | 'registration_id' | 'created_at'>[]
  ): Registration {
    const now = new Date().toISOString();
    const regId = generateUUID();
    const publicCode = generatePublicCode();

    const registration: Registration = {
      ...regData,
      id: regId,
      public_code: publicCode,
      created_at: now,
      updated_at: now,
    };

    this.data.registrations.push(registration);

    // Save answers
    for (const ans of answers) {
      this.data.registration_answers.push({
        ...ans,
        id: generateUUID(),
        registration_id: regId,
        created_at: now,
      });
    }

    this.persist();
    return registration;
  }

  public getRegistrationById(id: string): Registration | undefined {
    return this.data.registrations.find((r) => r.id === id);
  }

  public getRegistrationBySubmissionAttemptId(attemptId: string): Registration | undefined {
    return this.data.registrations.find((r) => r.submission_attempt_id === attemptId);
  }

  public getRegistrationByPublicCode(publicCode: string): Registration | undefined {
    return this.data.registrations.find(
      (r) => r.public_code.toLowerCase() === publicCode.toLowerCase()
    );
  }

  public getRegistrations(): Registration[] {
    return this.data.registrations.slice().sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public getRegistrationAnswers(registrationId: string): RegistrationAnswer[] {
    return this.data.registration_answers.filter((a) => a.registration_id === registrationId);
  }

  public updateRegistrationStatus(id: string, status: Registration['status'], confirmedAt?: string): void {
    const r = this.data.registrations.find((item) => item.id === id);
    if (r) {
      r.status = status;
      r.updated_at = new Date().toISOString();
      if (confirmedAt) {
        r.confirmed_at = confirmedAt;
      }
      this.persist();
    }
  }

  public deleteCancelledRegistration(id: string): boolean {
    const registration = this.data.registrations.find((item) => item.id === id);
    if (!registration || registration.status !== 'cancelled') return false;

    this.data.registration_answers = this.data.registration_answers.filter(
      (answer) => answer.registration_id !== id
    );
    this.data.payments = this.data.payments.filter((payment) => payment.registration_id !== id);
    this.data.registrations = this.data.registrations.filter((item) => item.id !== id);
    this.persist();
    return true;
  }

  // Payments
  public findPaymentByAttemptId(attemptId: string): Payment | undefined {
    return this.data.payments.find((p) => p.attempt_id === attemptId);
  }

  public findPaymentByOrderNsu(orderNsu: string): Payment | undefined {
    return this.data.payments.find((p) => p.order_nsu === orderNsu);
  }

  public findPaymentByTransactionNsu(transactionNsu: string): Payment | undefined {
    return this.data.payments.find((p) => p.transaction_nsu === transactionNsu);
  }

  public getPaymentByRegistrationId(regId: string): Payment | undefined {
    // Return latest payment for registration
    const payments = this.data.payments
      .filter((p) => p.registration_id === regId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return payments[0];
  }

  public createPayment(input: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Payment {
    const now = new Date().toISOString();
    const payment: Payment = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    };
    this.data.payments.push(payment);
    this.persist();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.payments[idx] = {
      ...this.data.payments[idx],
      ...updates,
      id,
      updated_at: now,
    };
    this.persist();
    return this.data.payments[idx];
  }

  // Admin users
  public findAdminByUsername(username: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public findAdminById(id: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.id === id);
  }

  public updateAdminPassword(id: string, newPasswordHash: string): void {
    const user = this.data.admin_users.find((u) => u.id === id);
    if (user) {
      user.password_hash = newPasswordHash;
      this.persist();
    }
  }

  // Get complete registration details
  public getRegistrationWithDetails(id: string) {
    const reg = this.getRegistrationById(id);
    if (!reg) return null;
    const answers = this.getRegistrationAnswers(id);
    const payment = this.getPaymentByRegistrationId(id);
    return {
      ...reg,
      answers,
      payment,
    };
  }

  // Raw data access for reporting/export
  public getAllData() {
    return this.data;
  }
}

export const db = new Database();
