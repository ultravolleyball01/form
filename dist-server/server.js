// server.ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path2 from "path";

// server/config.ts
import dotenv from "dotenv";
dotenv.config();
function requireProductionValue(name, minimumLength = 1) {
  if (process.env.NODE_ENV !== "production" && process.env.CONTEXT !== "production") return;
  const value = process.env[name]?.trim() || "";
  if (value.length < minimumLength) {
    throw new Error(`${name} \xE9 obrigat\xF3rio em produ\xE7\xE3o`);
  }
}
function validateRuntimeConfig() {
  requireProductionValue("ADMIN_SESSION_SECRET", 32);
  requireProductionValue("INFINITEPAY_HANDLE");
  if (process.env.NODE_ENV === "production" || process.env.CONTEXT === "production") {
    const configuredUrl = getAppUrl();
    if (!configuredUrl) {
      throw new Error("APP_URL \xE9 obrigat\xF3ria em produ\xE7\xE3o fora da Netlify");
    }
    const appUrl = new URL(configuredUrl);
    if (appUrl.protocol !== "https:") {
      throw new Error("APP_URL deve usar HTTPS em produ\xE7\xE3o");
    }
  }
}
function getAppUrl() {
  const netlifyPreviewUrl = process.env.CONTEXT === "deploy-preview" ? process.env.DEPLOY_PRIME_URL : void 0;
  const raw = (netlifyPreviewUrl || process.env.APP_URL || process.env.URL)?.trim();
  if (!raw) return void 0;
  try {
    return new URL(raw).origin;
  } catch {
    return void 0;
  }
}
validateRuntimeConfig();

// server/routes.ts
import { Router } from "express";
import crypto4 from "crypto";

// server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "ultra_db.json");
function usesManagedDatabase() {
  return Boolean(
    process.env.NETLIFY || process.env.NETLIFY_DB_URL || process.env.CONTEXT || process.env.DEPLOY_ID || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
  );
}
var INITIAL_CLASSES = [
  { display_label: "UNIDADE BATALHA - INFANTIL SEGUNDA 09HS", unit: "BATALHA", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "SEGUNDA", start_time: "09:00", active: true, sort_order: 1 },
  { display_label: "UNIDADE BATALHA - INFANTIL SEGUNDA 13:30HS", unit: "BATALHA", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "SEGUNDA", start_time: "13:30", active: true, sort_order: 2 },
  { display_label: "UNIDADE BATALHA - INFANTIL QUARTA 09HS", unit: "BATALHA", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "QUARTA", start_time: "09:00", active: true, sort_order: 3 },
  { display_label: "UNIDADE BATALHA - INFANTIL QUARTA 13:30HS", unit: "BATALHA", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "QUARTA", start_time: "13:30", active: true, sort_order: 4 },
  { display_label: "UNIDADE ITAQUERA - FEMININO QUARTA 18HS", unit: "ITAQUERA", category: "ADULTO", gender: "FEMININO", level: "INTERMEDI\xC1RIO", weekday: "QUARTA", start_time: "18:00", active: true, sort_order: 5 },
  { display_label: "UNIDADE ITAQUERA - MISTO QUARTA 20HS", unit: "ITAQUERA", category: "ADULTO", gender: "MISTO", level: "GERAL", weekday: "QUARTA", start_time: "20:00", active: true, sort_order: 6 },
  { display_label: "UNIDADE TATUAP\xC9 - INFANTIL SEGUNDA 17:30HS", unit: "TATUAP\xC9", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "SEGUNDA", start_time: "17:30", active: true, sort_order: 7 },
  { display_label: "UNIDADE TATUAP\xC9 - FEMININO SEGUNDA 19HS", unit: "TATUAP\xC9", category: "ADULTO", gender: "FEMININO", level: "INTERMEDI\xC1RIO", weekday: "SEGUNDA", start_time: "19:00", active: true, sort_order: 8 },
  { display_label: "UNIDADE VILA MATILDE - MASCULINO AVAN\xC7ADO", unit: "VILA MATILDE", category: "ADULTO", gender: "MASCULINO", level: "AVAN\xC7ADO", weekday: "SEGUNDA/QUARTA", start_time: "20:30", active: true, sort_order: 9 },
  { display_label: "UNIDADE VILA MATILDE - FEMININO AVAN\xC7ADO", unit: "VILA MATILDE", category: "ADULTO", gender: "FEMININO", level: "AVAN\xC7ADO", weekday: "TER\xC7A/QUINTA", start_time: "20:30", active: true, sort_order: 10 },
  { display_label: "UNIDADE VILA MATILDE - FEMININO TER\xC7A 17HS", unit: "VILA MATILDE", category: "ADULTO", gender: "FEMININO", level: "INTERMEDI\xC1RIO", weekday: "TER\xC7A", start_time: "17:00", active: true, sort_order: 11 },
  { display_label: "UNIDADE VILA MATILDE - MASCULINO QUARTA 17:30", unit: "VILA MATILDE", category: "ADULTO", gender: "MASCULINO", level: "INTERMEDI\xC1RIO", weekday: "QUARTA", start_time: "17:30", active: true, sort_order: 12 },
  { display_label: "UNIDADE VILA MATILDE - INFANTIL QUINTA 09HS", unit: "VILA MATILDE", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "QUINTA", start_time: "09:00", active: true, sort_order: 13 },
  { display_label: "UNIDADE VILA MATILDE - INFANTIL QUINTA 14HS", unit: "VILA MATILDE", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "QUINTA", start_time: "14:00", active: true, sort_order: 14 },
  { display_label: "UNIDADE VILA MATILDE - FEMININO QUINTA 15:30HS", unit: "VILA MATILDE", category: "ADULTO", gender: "FEMININO", level: "GERAL", weekday: "QUINTA", start_time: "15:30", active: true, sort_order: 15 },
  { display_label: "UNIDADE VILA MATILDE - ADULTO QUINTA 17:30HS", unit: "VILA MATILDE", category: "ADULTO", gender: "MISTO", level: "GERAL", weekday: "QUINTA", start_time: "17:30", active: true, sort_order: 16 },
  { display_label: "UNIDADE VILA MATILDE - MISTO SEXTA 14HS", unit: "VILA MATILDE", category: "ADULTO", gender: "MISTO", level: "GERAL", weekday: "SEXTA", start_time: "14:00", active: true, sort_order: 17 },
  { display_label: "UNIDADE VILA R\xC9 - INFANTIL TER\xC7A 18:30HS", unit: "VILA R\xC9", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "TER\xC7A", start_time: "18:30", active: true, sort_order: 18 },
  { display_label: "UNIDADE VILA R\xC9 - MISTO TER\xC7A 20HS", unit: "VILA R\xC9", category: "ADULTO", gender: "MISTO", level: "GERAL", weekday: "TER\xC7A", start_time: "20:00", active: true, sort_order: 19 },
  { display_label: "UNIDADE VILA R\xC9 - FEMININO QUINTA 15:30HS", unit: "VILA R\xC9", category: "ADULTO", gender: "FEMININO", level: "GERAL", weekday: "QUINTA", start_time: "15:30", active: true, sort_order: 20 },
  { display_label: "UNIDADE VILA R\xC9 - INFANTIL QUINTA 18:30HS", unit: "VILA R\xC9", category: "INFANTIL", gender: "MISTO", level: "INICIANTE", weekday: "QUINTA", start_time: "18:30", active: true, sort_order: 21 },
  { display_label: "UNIDADE VILA R\xC9 - MISTO QUINTA 20HS", unit: "VILA R\xC9", category: "ADULTO", gender: "MISTO", level: "GERAL", weekday: "QUINTA", start_time: "20:00", active: true, sort_order: 22 }
];
var INITIAL_SHIRT_SIZES = [
  // Adulto
  { code: "G5", name: "G5 Adulto", width_cm: 71.5, length_cm: 94, category: "adult", active: true, sort_order: 1 },
  { code: "G4", name: "G4 Adulto", width_cm: 69, length_cm: 91, category: "adult", active: true, sort_order: 2 },
  { code: "G3", name: "G3 Adulto", width_cm: 67.5, length_cm: 89, category: "adult", active: true, sort_order: 3 },
  { code: "G2", name: "G2 Adulto", width_cm: 66, length_cm: 87, category: "adult", active: true, sort_order: 4 },
  { code: "G1", name: "G1 Adulto", width_cm: 64, length_cm: 84, category: "adult", active: true, sort_order: 5 },
  { code: "GG", name: "GG Adulto", width_cm: 62, length_cm: 81.5, category: "adult", active: true, sort_order: 6 },
  { code: "G", name: "G Adulto", width_cm: 58.5, length_cm: 78.5, category: "adult", active: true, sort_order: 7 },
  { code: "M", name: "M Adulto", width_cm: 53.5, length_cm: 76.5, category: "adult", active: true, sort_order: 8 },
  { code: "P", name: "P Adulto", width_cm: 53, length_cm: 75, category: "adult", active: true, sort_order: 9 },
  { code: "PP", name: "PP Adulto", width_cm: 50, length_cm: 72, category: "adult", active: true, sort_order: 10 },
  // Infantil
  { code: "G INF.", name: "G Infantil", width_cm: 48, length_cm: 67, category: "child", active: true, sort_order: 11 },
  { code: "M INF.", name: "M Infantil", width_cm: 45, length_cm: 66, category: "child", active: true, sort_order: 12 },
  { code: "P INF.", name: "P Infantil", width_cm: 42, length_cm: 58, category: "child", active: true, sort_order: 13 },
  { code: "PP INF.", name: "PP Infantil", width_cm: 37, length_cm: 51, category: "child", active: true, sort_order: 14 },
  { code: "BB", name: "BB Beb\xEA/Infantil", width_cm: 34, length_cm: 42, category: "child", active: true, sort_order: 15 }
];
var INITIAL_FORM_FIELDS = [
  {
    key: "full_name",
    label: "Nome completo",
    description: "Informe o nome completo do aluno ou respons\xE1vel",
    field_type: "text",
    placeholder: "Ex: Lucas Silva Oliveira",
    required: true,
    active: true,
    sort_order: 1,
    system_type: "full_name"
  },
  {
    key: "class_id",
    label: "Unidade/Turma",
    description: "Selecione a unidade e o hor\xE1rio onde treina",
    field_type: "class_selector",
    placeholder: "Selecione sua turma...",
    required: true,
    active: true,
    sort_order: 2,
    system_type: "class_id"
  },
  {
    key: "shirt_size_id",
    label: "Tamanho camiseta",
    description: "Escolha o tamanho ideal (consulte a tabela de medidas abaixo)",
    field_type: "shirt_size_selector",
    placeholder: "Selecione o tamanho...",
    required: true,
    active: true,
    sort_order: 3,
    system_type: "shirt_size_id"
  }
];
function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
function generatePublicCode() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ULTRA-${code}`;
}
function generateUUID() {
  return crypto.randomUUID();
}
var Database = class {
  constructor() {
    this.managedDatabase = usesManagedDatabase();
    this.data = this.load();
  }
  load() {
    if (!this.managedDatabase && !fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!this.managedDatabase && fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(content);
      } catch (err) {
        console.error("Error reading db file, re-initializing...", err);
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isProduction = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
    if (isProduction && !process.env.ADMIN_INITIAL_PASSWORD) {
      throw new Error("ADMIN_INITIAL_PASSWORD \xE9 obrigat\xF3ria na primeira inicializa\xE7\xE3o do banco");
    }
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(18).toString("base64url");
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.warn(`[SECURITY] Senha tempor\xE1ria do administrador local: ${initialPassword}`);
    }
    const seeded = {
      system_settings: [
        {
          id: generateUUID(),
          key: "shirt_price",
          value: "7000",
          // 7000 centavos = R$ 70,00
          updated_at: now
        }
      ],
      classes: INITIAL_CLASSES.map((c) => ({
        ...c,
        id: generateUUID(),
        created_at: now,
        updated_at: now
      })),
      shirt_sizes: INITIAL_SHIRT_SIZES.map((s) => ({
        ...s,
        id: generateUUID(),
        created_at: now,
        updated_at: now
      })),
      form_fields: INITIAL_FORM_FIELDS.map((f) => ({
        ...f,
        id: generateUUID(),
        created_at: now,
        updated_at: now
      })),
      registrations: [],
      registration_answers: [],
      payments: [],
      admin_users: [
        {
          id: generateUUID(),
          username: "admin",
          password_hash: hashPassword(initialPassword),
          role: "admin",
          name: "Coordenador Ultra Volleyball",
          created_at: now
        }
      ]
    };
    if (!this.managedDatabase) {
      this.saveData(seeded);
    }
    return seeded;
  }
  saveData(data) {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
  }
  persist() {
    if (this.managedDatabase) return;
    this.saveData(this.data);
  }
  exportData() {
    return structuredClone(this.data);
  }
  replaceData(data) {
    const requiredCollections = [
      "system_settings",
      "classes",
      "shirt_sizes",
      "form_fields",
      "registrations",
      "registration_answers",
      "payments",
      "admin_users"
    ];
    if (!requiredCollections.every((key) => Array.isArray(data?.[key]))) {
      throw new Error("Estado persistido do sistema \xE9 inv\xE1lido");
    }
    this.data = structuredClone(data);
  }
  // System settings
  getSetting(key, defaultValue = "") {
    const s = this.data.system_settings.find((item) => item.key === key);
    return s ? s.value : defaultValue;
  }
  setSetting(key, value) {
    const s = this.data.system_settings.find((item) => item.key === key);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (s) {
      s.value = value;
      s.updated_at = now;
    } else {
      this.data.system_settings.push({
        id: generateUUID(),
        key,
        value,
        updated_at: now
      });
    }
    this.persist();
  }
  getShirtPrice() {
    const val = this.getSetting("shirt_price", "7000");
    const parsed = parseInt(val, 10);
    return Number.isFinite(parsed) ? parsed : 7e3;
  }
  // Classes
  getClasses(onlyActive = true) {
    const list = onlyActive ? this.data.classes.filter((c) => c.active) : this.data.classes;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  getClassById(id) {
    return this.data.classes.find((c) => c.id === id);
  }
  createClass(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const item = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    this.data.classes.push(item);
    this.persist();
    return item;
  }
  updateClass(id, updates) {
    const idx = this.data.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.data.classes[idx] = {
      ...this.data.classes[idx],
      ...updates,
      id,
      updated_at: now
    };
    this.persist();
    return this.data.classes[idx];
  }
  hasRegistrationsForClass(classId) {
    return this.data.registrations.some((r) => r.class_id === classId);
  }
  // Sizes
  getShirtSizes(onlyActive = true) {
    const list = onlyActive ? this.data.shirt_sizes.filter((s) => s.active) : this.data.shirt_sizes;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  getShirtSizeById(id) {
    return this.data.shirt_sizes.find((s) => s.id === id);
  }
  createShirtSize(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const item = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    this.data.shirt_sizes.push(item);
    this.persist();
    return item;
  }
  updateShirtSize(id, updates) {
    const idx = this.data.shirt_sizes.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.data.shirt_sizes[idx] = {
      ...this.data.shirt_sizes[idx],
      ...updates,
      id,
      updated_at: now
    };
    this.persist();
    return this.data.shirt_sizes[idx];
  }
  // Form fields
  getFormFields(onlyActive = true) {
    const list = onlyActive ? this.data.form_fields.filter((f) => f.active) : this.data.form_fields;
    return list.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  getFormFieldById(id) {
    return this.data.form_fields.find((f) => f.id === id);
  }
  createFormField(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const item = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    this.data.form_fields.push(item);
    this.persist();
    return item;
  }
  updateFormField(id, updates) {
    const idx = this.data.form_fields.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = this.data.form_fields[idx];
    if (existing.system_type) {
      delete updates.system_type;
      delete updates.key;
      delete updates.field_type;
    }
    this.data.form_fields[idx] = {
      ...existing,
      ...updates,
      id,
      updated_at: now
    };
    this.persist();
    return this.data.form_fields[idx];
  }
  reorderFormFields(orderedIds) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
  createRegistration(regData, answers) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const regId = generateUUID();
    const publicCode = generatePublicCode();
    const registration = {
      ...regData,
      id: regId,
      public_code: publicCode,
      created_at: now,
      updated_at: now
    };
    this.data.registrations.push(registration);
    for (const ans of answers) {
      this.data.registration_answers.push({
        ...ans,
        id: generateUUID(),
        registration_id: regId,
        created_at: now
      });
    }
    this.persist();
    return registration;
  }
  getRegistrationById(id) {
    return this.data.registrations.find((r) => r.id === id);
  }
  getRegistrationBySubmissionAttemptId(attemptId) {
    return this.data.registrations.find((r) => r.submission_attempt_id === attemptId);
  }
  getRegistrationByPublicCode(publicCode) {
    return this.data.registrations.find(
      (r) => r.public_code.toLowerCase() === publicCode.toLowerCase()
    );
  }
  getRegistrations() {
    return this.data.registrations.slice().sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }
  getRegistrationAnswers(registrationId) {
    return this.data.registration_answers.filter((a) => a.registration_id === registrationId);
  }
  updateRegistrationStatus(id, status, confirmedAt) {
    const r = this.data.registrations.find((item) => item.id === id);
    if (r) {
      r.status = status;
      r.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (confirmedAt) {
        r.confirmed_at = confirmedAt;
      }
      this.persist();
    }
  }
  deleteCancelledRegistration(id) {
    const registration = this.data.registrations.find((item) => item.id === id);
    if (!registration || registration.status !== "cancelled") return false;
    this.data.registration_answers = this.data.registration_answers.filter(
      (answer) => answer.registration_id !== id
    );
    this.data.payments = this.data.payments.filter((payment) => payment.registration_id !== id);
    this.data.registrations = this.data.registrations.filter((item) => item.id !== id);
    this.persist();
    return true;
  }
  // Payments
  findPaymentByAttemptId(attemptId) {
    return this.data.payments.find((p) => p.attempt_id === attemptId);
  }
  findPaymentByOrderNsu(orderNsu) {
    return this.data.payments.find((p) => p.order_nsu === orderNsu);
  }
  findPaymentByTransactionNsu(transactionNsu) {
    return this.data.payments.find((p) => p.transaction_nsu === transactionNsu);
  }
  getPaymentByRegistrationId(regId) {
    const payments = this.data.payments.filter((p) => p.registration_id === regId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return payments[0];
  }
  createPayment(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const payment = {
      ...input,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    this.data.payments.push(payment);
    this.persist();
    return payment;
  }
  updatePayment(id, updates) {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.data.payments[idx] = {
      ...this.data.payments[idx],
      ...updates,
      id,
      updated_at: now
    };
    this.persist();
    return this.data.payments[idx];
  }
  // Admin users
  findAdminByUsername(username) {
    return this.data.admin_users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }
  findAdminById(id) {
    return this.data.admin_users.find((u) => u.id === id);
  }
  updateAdminPassword(id, newPasswordHash) {
    const user = this.data.admin_users.find((u) => u.id === id);
    if (user) {
      user.password_hash = newPasswordHash;
      this.persist();
    }
  }
  // Get complete registration details
  getRegistrationWithDetails(id) {
    const reg = this.getRegistrationById(id);
    if (!reg) return null;
    const answers = this.getRegistrationAnswers(id);
    const payment = this.getPaymentByRegistrationId(id);
    return {
      ...reg,
      answers,
      payment
    };
  }
  // Raw data access for reporting/export
  getAllData() {
    return this.data;
  }
};
var db = new Database();

// server/infinitepay.ts
import crypto2 from "crypto";
var DEFAULT_API_URL = "https://api.checkout.infinitepay.io";
var PROVIDER_TIMEOUT_MS = 8e3;
var ALLOWED_CHECKOUT_HOSTS = /* @__PURE__ */ new Set([
  "checkout.infinitepay.com.br",
  "checkout.infinitepay.io"
]);
var InfinitePayError = class extends Error {
  constructor(message, code, httpStatus, providerStatus) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.providerStatus = providerStatus;
    this.name = "InfinitePayError";
  }
};
function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
}
function normalizeHandle(value) {
  return (value || "").trim().replace(/^[$@]+/, "");
}
function safeProviderMessage(payload, handle) {
  if (!payload || typeof payload !== "object") return void 0;
  const record = payload;
  const detail = record.message ?? record.error ?? record.detail;
  if (typeof detail !== "string") return void 0;
  let sanitized = detail.replace(/[\r\n\t]+/g, " ").replace(/https?:\/\/\S+/gi, "[url]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/[A-Za-z0-9_-]{32,}/g, "[token]");
  if (handle) sanitized = sanitized.replaceAll(handle, "[handle]");
  return sanitized.slice(0, 180);
}
function safeHttpsUrl(value) {
  if (typeof value !== "string" || !value) return void 0;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : void 0;
  } catch {
    return void 0;
  }
}
function nonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : void 0;
}
var InfinitePayProvider = class {
  getHandle() {
    const raw = isProductionRuntime() ? process.env.INFINITEPAY_HANDLE : db.getSetting("infinitepay_handle") || process.env.INFINITEPAY_HANDLE;
    const handle = normalizeHandle(raw);
    if (!handle || !/^[^\s/?#]{2,100}$/.test(handle)) {
      throw new InfinitePayError(
        "INFINITEPAY_HANDLE n\xE3o configurado ou inv\xE1lido",
        "configuration_error",
        500
      );
    }
    return handle;
  }
  getHandleDiagnostic() {
    const source = isProductionRuntime() || !db.getSetting("infinitepay_handle") ? "environment" : "database";
    const handle = this.getHandle();
    const masked = handle.length <= 4 ? `${handle[0] || ""}***` : `${handle.slice(0, 2)}***${handle.slice(-2)}`;
    return { source, masked };
  }
  getMode() {
    if (isProductionRuntime()) return "production";
    const fromDb = db.getSetting("infinitepay_mode");
    const raw = (fromDb || process.env.INFINITEPAY_MODE || "production").toLowerCase().trim();
    return ["sandbox", "teste", "test"].includes(raw) ? "sandbox" : "production";
  }
  getApiUrl() {
    const configured = (process.env.INFINITEPAY_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, "");
    let url;
    try {
      url = new URL(configured);
    } catch {
      throw new InfinitePayError("INFINITEPAY_API_URL inv\xE1lida", "configuration_error", 500);
    }
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || isProductionRuntime() && url.hostname !== "api.checkout.infinitepay.io") {
      throw new InfinitePayError("INFINITEPAY_API_URL n\xE3o autorizada", "configuration_error", 500);
    }
    return url.origin;
  }
  async post(path3, body, orderNsu) {
    let response;
    try {
      response = await fetch(`${this.getApiUrl()}${path3}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS)
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("InfinitePay request failed", {
        operation: path3,
        orderNsu,
        reason: timedOut ? "timeout" : "network_error"
      });
      throw new InfinitePayError(
        timedOut ? "Tempo limite excedido ao consultar a InfinitePay" : "InfinitePay indispon\xEDvel",
        timedOut ? "provider_timeout" : "provider_unavailable",
        timedOut ? 504 : 502
      );
    }
    const rawBody = await response.text();
    let payload = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const detail = safeProviderMessage(
        payload,
        typeof body.handle === "string" ? body.handle : void 0
      );
      console.error("InfinitePay request rejected", {
        operation: path3,
        orderNsu,
        status: response.status,
        contentType: response.headers.get("content-type"),
        responseKeys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 12) : [],
        detail
      });
      throw new InfinitePayError(
        detail || `InfinitePay respondeu com HTTP ${response.status}`,
        "provider_rejected",
        502,
        response.status
      );
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      console.error("InfinitePay returned an invalid response", {
        operation: path3,
        orderNsu,
        status: response.status,
        contentType: response.headers.get("content-type")
      });
      throw new InfinitePayError(
        "A InfinitePay retornou uma resposta inv\xE1lida",
        "invalid_provider_response",
        502
      );
    }
    return payload;
  }
  static generateWebhookToken() {
    const rawToken = crypto2.randomBytes(32).toString("hex");
    const tokenHash = crypto2.createHash("sha256").update(rawToken).digest("hex");
    return { rawToken, tokenHash };
  }
  static hashToken(rawToken) {
    return crypto2.createHash("sha256").update(rawToken).digest("hex");
  }
  async createPaymentLink(params) {
    if (this.getMode() === "sandbox") {
      return {
        checkoutUrl: `/checkout/infinitepay?order_nsu=${encodeURIComponent(params.orderNsu)}&token=${encodeURIComponent(params.webhookToken)}`
      };
    }
    const data = await this.post("/links", {
      handle: this.getHandle(),
      order_nsu: params.orderNsu,
      redirect_url: params.returnUrl,
      webhook_url: params.webhookUrl,
      customer: {
        name: params.customerName
      },
      items: [
        {
          quantity: 1,
          price: params.amountCents,
          description: `Camiseta Ultra Volleyball - ${params.registrationPublicCode}`
        }
      ]
    }, params.orderNsu);
    let checkoutUrl;
    try {
      checkoutUrl = new URL(String(data.url || ""));
    } catch {
      throw new InfinitePayError(
        "A InfinitePay n\xE3o retornou uma URL de checkout v\xE1lida",
        "invalid_provider_response",
        502
      );
    }
    if (checkoutUrl.protocol !== "https:" || !ALLOWED_CHECKOUT_HOSTS.has(checkoutUrl.hostname.toLowerCase())) {
      console.error("InfinitePay returned an unexpected checkout host", {
        orderNsu: params.orderNsu,
        protocol: checkoutUrl.protocol,
        host: checkoutUrl.hostname
      });
      throw new InfinitePayError(
        "A InfinitePay retornou um endere\xE7o de checkout inesperado",
        "invalid_provider_response",
        502
      );
    }
    return {
      checkoutUrl: checkoutUrl.href,
      // The real slug is supplied by the redirect/webhook. Never invent one.
      invoiceSlug: typeof data.slug === "string" && data.slug ? data.slug : void 0
    };
  }
  async checkPayment(orderNsu, payment, details = {}) {
    if (this.getMode() === "sandbox") {
      return payment.status === "paid" ? {
        success: true,
        paid: true,
        orderAmount: payment.amount,
        paidAmount: payment.paid_amount ?? payment.amount,
        transactionNsu: payment.transaction_nsu,
        installments: payment.installments ?? 1,
        captureMethod: payment.capture_method || "pix",
        receiptUrl: safeHttpsUrl(payment.receipt_url)
      } : { success: true, paid: false, rawStatus: payment.status };
    }
    const transactionNsu = details.transactionNsu || payment.transaction_nsu;
    const invoiceSlug = details.invoiceSlug || payment.invoice_slug;
    if (!transactionNsu || !invoiceSlug) {
      return { success: true, paid: false, rawStatus: "awaiting_provider_reference" };
    }
    const data = await this.post("/payment_check", {
      handle: this.getHandle(),
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug: invoiceSlug
    }, orderNsu);
    return {
      success: data.success === true,
      paid: data.success === true && data.paid === true,
      orderAmount: nonNegativeInteger(data.amount),
      paidAmount: nonNegativeInteger(data.paid_amount),
      transactionNsu,
      invoiceSlug,
      installments: nonNegativeInteger(data.installments),
      captureMethod: typeof data.capture_method === "string" ? data.capture_method : void 0,
      receiptUrl: safeHttpsUrl(data.receipt_url),
      rawStatus: data.paid === true ? "paid" : "pending"
    };
  }
};
var infinitePayProvider = new InfinitePayProvider();
function confirmPayment(params) {
  const transactionNsu = params.transactionNsu.trim();
  if (!transactionNsu) {
    return { success: false, error: "Transa\xE7\xE3o n\xE3o informada" };
  }
  const payment = db.findPaymentByOrderNsu(params.orderNsu);
  if (!payment) {
    return { success: false, error: "Pagamento n\xE3o encontrado" };
  }
  if (payment.status === "paid") {
    if (payment.transaction_nsu !== transactionNsu) {
      console.error("Paid order received a different transaction reference", {
        orderNsu: params.orderNsu
      });
      return { success: false, conflict: true, error: "Transa\xE7\xE3o diverge da confirma\xE7\xE3o anterior" };
    }
    const receiptUrl = safeHttpsUrl(params.receiptUrl);
    const reconciledPayment = !payment.receipt_url && receiptUrl ? db.updatePayment(payment.id, { receipt_url: receiptUrl }) || payment : payment;
    return {
      success: true,
      payment: reconciledPayment,
      registration: db.getRegistrationById(payment.registration_id)
    };
  }
  if (!Number.isInteger(params.orderAmount) || params.orderAmount !== payment.amount) {
    console.error("Payment amount mismatch", {
      orderNsu: params.orderNsu,
      expected: payment.amount,
      received: params.orderAmount
    });
    return { success: false, conflict: true, error: "Valor confirmado diverge do valor esperado" };
  }
  const existingWithTransaction = db.findPaymentByTransactionNsu(transactionNsu);
  if (existingWithTransaction && existingWithTransaction.id !== payment.id) {
    console.error("Duplicate transaction reference", { orderNsu: params.orderNsu });
    return { success: false, conflict: true, error: "Transa\xE7\xE3o j\xE1 associada a outra inscri\xE7\xE3o" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updatedPayment = db.updatePayment(payment.id, {
    status: "paid",
    paid_amount: params.paidAmount,
    transaction_nsu: transactionNsu,
    capture_method: params.captureMethod,
    installments: params.installments,
    receipt_url: safeHttpsUrl(params.receiptUrl),
    error: void 0,
    paid_at: now
  });
  db.updateRegistrationStatus(payment.registration_id, "confirmed", now);
  return {
    success: true,
    payment: updatedPayment || payment,
    registration: db.getRegistrationById(payment.registration_id)
  };
}

// server/auth.ts
import crypto3 from "crypto";
var SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto3.randomBytes(32).toString("hex");
function createAdminToken(userId) {
  const payload = `${userId}:${Date.now()}`;
  const signature = crypto3.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}
function verifyAdminToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, timestampStr, signature] = parts;
    const payload = `${userId}:${timestampStr}`;
    const expectedSig = crypto3.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");
    if (signatureBuffer.length !== expectedBuffer.length || !crypto3.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (now - timestamp > 7 * 24 * 60 * 60 * 1e3) {
      return null;
    }
    const admin = db.findAdminById(userId);
    if (!admin || admin.role !== "admin") {
      return null;
    }
    return { userId };
  } catch (err) {
    return null;
  }
}
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }
  if (!token) {
    res.status(401).json({ error: "Acesso restrito. Fa\xE7a login para continuar." });
    return;
  }
  const verified = verifyAdminToken(token);
  if (!verified) {
    res.status(401).json({ error: "Sess\xE3o expirada ou inv\xE1lida. Fa\xE7a login novamente." });
    return;
  }
  const user = db.findAdminById(verified.userId);
  if (!user) {
    res.status(401).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    return;
  }
  req.adminUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  };
  next();
}

// server/security.ts
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
function getRateLimitKey(req) {
  const netlifyIp = req.get("x-nf-client-connection-ip")?.trim();
  const forwardedIp = req.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = netlifyIp || forwardedIp || req.ip || req.socket.remoteAddress;
  return clientIp ? ipKeyGenerator(clientIp) : "unknown-client";
}
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." }
});
var registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: "Muitas inscri\xE7\xF5es enviadas. Tente novamente mais tarde." }
});
var paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1e3,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: { error: "Muitas consultas de pagamento. Aguarde alguns minutos." }
});
function requireSameOrigin(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }
  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }
  const configuredOrigin = getAppUrl();
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  if (origin !== configuredOrigin && origin !== requestOrigin) {
    res.status(403).json({ error: "Origem da requisi\xE7\xE3o n\xE3o autorizada" });
    return;
  }
  next();
}

// server/routes.ts
import { z } from "zod";
var apiRouter = Router();
apiRouter.use("/admin", requireSameOrigin);
apiRouter.use(["/registrations", "/create-order", "/payment-check", "/sandbox"], requireSameOrigin);
var registrationInputSchema = z.object({
  attempt_id: z.string().trim().min(8).max(128).optional(),
  full_name: z.string().trim().min(3).max(150),
  class_id: z.string().uuid(),
  shirt_size_id: z.string().uuid(),
  dynamic_answers: z.record(z.string(), z.unknown()).optional().default({})
});
var createOrderInputSchema = z.object({
  registration_id: z.string().uuid(),
  attempt_id: z.string().trim().min(8).max(128)
});
var paymentCheckInputSchema = z.object({
  order_nsu: z.string().uuid(),
  transaction_nsu: z.string().trim().min(1).max(200),
  invoice_slug: z.string().trim().min(1).max(200)
});
var infinitePayWebhookSchema = z.object({
  order_nsu: z.string().uuid(),
  amount: z.coerce.number().int().nonnegative(),
  paid_amount: z.coerce.number().int().nonnegative().optional(),
  transaction_nsu: z.string().trim().min(1).max(200),
  capture_method: z.string().trim().max(80).optional(),
  installments: z.coerce.number().int().positive().max(100).optional(),
  receipt_url: z.string().trim().max(2048).optional(),
  invoice_slug: z.string().trim().min(1).max(200).optional()
});
var loginInputSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200)
});
function safePublicHttpsUrl(value) {
  if (!value) return void 0;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : void 0;
  } catch {
    return void 0;
  }
}
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
apiRouter.get("/public-config", (req, res) => {
  try {
    const shirt_price = db.getShirtPrice();
    const form_fields = db.getFormFields(true);
    const classes = db.getClasses(true);
    const shirt_sizes = db.getShirtSizes(true);
    res.json({
      shirt_price,
      form_fields,
      classes,
      shirt_sizes
    });
  } catch (err) {
    console.error("Error in /api/public-config:", err);
    res.status(500).json({ error: "Erro ao carregar configura\xE7\xF5es do formul\xE1rio" });
  }
});
apiRouter.post("/registrations", registrationLimiter, (req, res) => {
  try {
    const parsed = registrationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados da inscri\xE7\xE3o inv\xE1lidos." });
      return;
    }
    const { attempt_id, full_name, class_id, shirt_size_id, dynamic_answers } = parsed.data;
    if (attempt_id) {
      const existing = db.getRegistrationBySubmissionAttemptId(attempt_id);
      if (existing) {
        const sameSubmission = existing.participant_name === full_name.trim() && existing.class_id === class_id && existing.shirt_size_id === shirt_size_id;
        if (!sameSubmission) {
          res.status(409).json({ error: "Identificador de tentativa j\xE1 utilizado em outra inscri\xE7\xE3o." });
          return;
        }
        res.json({
          registration: {
            id: existing.id,
            public_code: existing.public_code,
            participant_name: existing.participant_name,
            class_label: existing.class_label_snapshot,
            shirt_size_code: existing.shirt_size_code_snapshot,
            shirt_category: existing.shirt_category_snapshot,
            amount: existing.amount,
            status: existing.status
          },
          reused: true
        });
        return;
      }
    }
    const trimmedName = typeof full_name === "string" ? full_name.trim() : "";
    if (!trimmedName || trimmedName.length < 3) {
      res.status(400).json({ error: "O nome completo \xE9 obrigat\xF3rio (m\xEDnimo 3 caracteres)." });
      return;
    }
    if (!class_id) {
      res.status(400).json({ error: "A sele\xE7\xE3o da turma \xE9 obrigat\xF3ria." });
      return;
    }
    const classItem = db.getClassById(class_id);
    if (!classItem || !classItem.active) {
      res.status(400).json({ error: "A turma selecionada n\xE3o \xE9 v\xE1lida ou foi desativada." });
      return;
    }
    if (!shirt_size_id) {
      res.status(400).json({ error: "A sele\xE7\xE3o do tamanho da camiseta \xE9 obrigat\xF3ria." });
      return;
    }
    const shirtSize = db.getShirtSizeById(shirt_size_id);
    if (!shirtSize || !shirtSize.active) {
      res.status(400).json({ error: "O tamanho de camiseta selecionado n\xE3o \xE9 v\xE1lido ou foi desativado." });
      return;
    }
    const activeFields = db.getFormFields(true);
    const answersToSave = [];
    const fullNameField = activeFields.find((f) => f.key === "full_name");
    answersToSave.push({
      field_id: fullNameField ? fullNameField.id : "system_full_name",
      field_key_snapshot: "full_name",
      label_snapshot: fullNameField ? fullNameField.label : "Nome completo",
      value: trimmedName
    });
    const classField = activeFields.find((f) => f.key === "class_id");
    answersToSave.push({
      field_id: classField ? classField.id : "system_class_id",
      field_key_snapshot: "class_id",
      label_snapshot: classField ? classField.label : "Unidade/Turma",
      value: classItem.display_label
    });
    const sizeField = activeFields.find((f) => f.key === "shirt_size_id");
    answersToSave.push({
      field_id: sizeField ? sizeField.id : "system_shirt_size_id",
      field_key_snapshot: "shirt_size_id",
      label_snapshot: sizeField ? sizeField.label : "Tamanho camiseta",
      value: `${shirtSize.code} (${shirtSize.category === "adult" ? "Adulto" : "Infantil"}) - ${shirtSize.width_cm}x${shirtSize.length_cm} cm`
    });
    const customAnswers = dynamic_answers && typeof dynamic_answers === "object" ? dynamic_answers : {};
    for (const field of activeFields) {
      if (field.system_type) continue;
      const rawVal = customAnswers[field.id];
      const valStr = rawVal !== void 0 && rawVal !== null ? String(rawVal).trim() : "";
      if (field.required && !valStr) {
        res.status(400).json({ error: `O campo "${field.label}" \xE9 obrigat\xF3rio.` });
        return;
      }
      if (valStr) {
        answersToSave.push({
          field_id: field.id,
          field_key_snapshot: field.key,
          label_snapshot: field.label,
          value: valStr
        });
      }
    }
    const shirt_price = db.getShirtPrice();
    const registration = db.createRegistration(
      {
        submission_attempt_id: attempt_id,
        participant_name: trimmedName,
        class_id: classItem.id,
        class_label_snapshot: classItem.display_label,
        shirt_size_id: shirtSize.id,
        shirt_size_code_snapshot: shirtSize.code,
        shirt_width_cm_snapshot: shirtSize.width_cm,
        shirt_length_cm_snapshot: shirtSize.length_cm,
        shirt_category_snapshot: shirtSize.category,
        shirt_quantity: 1,
        // Rule 1: always 1
        amount: shirt_price,
        // Preserved snapshot
        status: "pending_payment"
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
        status: registration.status
      }
    });
  } catch (err) {
    console.error("Error in /api/registrations:", err);
    res.status(500).json({ error: "Erro ao processar inscri\xE7\xE3o" });
  }
});
apiRouter.post("/create-order", paymentLimiter, async (req, res) => {
  let createdPaymentId;
  let registrationId;
  try {
    const parsed = createOrderInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Identificadores de inscri\xE7\xE3o ou tentativa inv\xE1lidos." });
      return;
    }
    const { registration_id, attempt_id } = parsed.data;
    const existingPayment = db.findPaymentByAttemptId(attempt_id);
    if (existingPayment) {
      if (existingPayment.registration_id !== registration_id) {
        res.status(409).json({ error: "Identificador de tentativa j\xE1 utilizado." });
        return;
      }
      if (existingPayment.status === "cancelled") {
        res.status(409).json({
          error: "Esta pend\xEAncia de pagamento foi cancelada pelo administrador.",
          code: "checkout_attempt_cancelled"
        });
        return;
      }
      if (existingPayment.checkout_url) {
        res.json({
          order_nsu: existingPayment.order_nsu,
          checkout_url: existingPayment.checkout_url,
          amount: existingPayment.amount,
          status: existingPayment.status,
          reused: true
        });
        return;
      }
      res.status(409).json({
        error: existingPayment.status === "failed" ? "A tentativa anterior falhou antes de criar o checkout. Inicie uma nova tentativa." : "Esta tentativa ainda est\xE1 sendo processada. Aguarde alguns segundos e tente novamente.",
        code: existingPayment.status === "failed" ? "checkout_attempt_failed" : "checkout_attempt_pending"
      });
      return;
    }
    const registration = db.getRegistrationById(registration_id);
    if (!registration) {
      res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    if (registration.status === "confirmed") {
      res.status(400).json({ error: "Esta inscri\xE7\xE3o j\xE1 foi paga e confirmada." });
      return;
    }
    if (registration.status === "cancelled" || registration.status === "expired") {
      res.status(409).json({
        error: registration.status === "cancelled" ? "Esta inscri\xE7\xE3o foi cancelada pelo administrador." : "Esta inscri\xE7\xE3o expirou.",
        code: registration.status === "cancelled" ? "registration_cancelled" : "registration_expired"
      });
      return;
    }
    registrationId = registration.id;
    const order_nsu = generateUUID();
    const { rawToken, tokenHash } = InfinitePayProvider.generateWebhookToken();
    const payment = db.createPayment({
      registration_id: registration.id,
      provider: "infinitepay",
      attempt_id,
      order_nsu,
      status: "pending",
      amount: registration.amount,
      // Snapshot from registration
      checkout_url: "",
      webhook_token_hash: tokenHash
    });
    createdPaymentId = payment.id;
    const configuredBaseUrl = getAppUrl();
    const productionRuntime = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
    if (!configuredBaseUrl && productionRuntime) {
      throw new Error("URL p\xFAblica can\xF4nica n\xE3o configurada");
    }
    const protocol = req.protocol || "http";
    const host = req.get("host");
    const baseUrl = configuredBaseUrl || `${protocol}://${host}`;
    const returnUrl = `${baseUrl}/pagamento/processando?order_nsu=${order_nsu}`;
    const webhookUrl = `${baseUrl}/api/webhook/infinitepay?token=${encodeURIComponent(rawToken)}`;
    const providerMode = infinitePayProvider.getMode();
    const handleDiagnostic = providerMode === "production" ? infinitePayProvider.getHandleDiagnostic() : { source: "database", masked: "sandbox" };
    console.info("Creating InfinitePay checkout", {
      orderNsu: order_nsu,
      attemptId: attempt_id,
      handleSource: handleDiagnostic.source,
      handle: handleDiagnostic.masked,
      providerMode,
      publicOrigin: new URL(baseUrl).origin
    });
    const linkResult = await infinitePayProvider.createPaymentLink({
      orderNsu: order_nsu,
      amountCents: registration.amount,
      customerName: registration.participant_name,
      webhookToken: rawToken,
      registrationPublicCode: registration.public_code,
      returnUrl,
      webhookUrl
    });
    db.updatePayment(payment.id, {
      checkout_url: linkResult.checkoutUrl,
      ...linkResult.invoiceSlug ? { invoice_slug: linkResult.invoiceSlug } : {},
      status: "processing"
    });
    db.updateRegistrationStatus(registration.id, "processing_payment");
    res.status(201).json({
      order_nsu,
      checkout_url: linkResult.checkoutUrl,
      attempt_id,
      amount: registration.amount,
      status: "processing"
    });
  } catch (err) {
    console.error("Error in /api/create-order", {
      paymentId: createdPaymentId,
      registrationId,
      code: err instanceof InfinitePayError ? err.code : "internal_error",
      providerStatus: err instanceof InfinitePayError ? err.providerStatus : void 0
    });
    if (createdPaymentId) {
      db.updatePayment(createdPaymentId, {
        status: "failed",
        error: err instanceof InfinitePayError ? err.code : "internal_error"
      });
    }
    if (registrationId) {
      db.updateRegistrationStatus(registrationId, "payment_failed");
    }
    const status = err instanceof InfinitePayError ? err.httpStatus : 500;
    res.status(status).json({
      error: err instanceof InfinitePayError ? err.code === "provider_timeout" ? "A InfinitePay demorou para responder. Tente novamente em instantes." : err.code === "configuration_error" ? "O checkout ainda n\xE3o est\xE1 configurado corretamente." : "N\xE3o foi poss\xEDvel iniciar o pagamento na InfinitePay." : "Erro ao gerar ordem de pagamento",
      code: err instanceof InfinitePayError ? err.code : "internal_error"
    });
  }
});
apiRouter.get("/order-status", (req, res) => {
  try {
    const orderNsu = req.query.order_nsu;
    const publicCode = req.query.public_code;
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
      res.status(404).json({ error: "Ordem ou inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    res.json({
      order_nsu: payment?.order_nsu,
      public_code: registration.public_code,
      status: registration.status,
      paid: registration.status === "confirmed",
      participant_name: registration.participant_name,
      class_label: registration.class_label_snapshot,
      shirt_size_code: registration.shirt_size_code_snapshot,
      shirt_category: registration.shirt_category_snapshot,
      width_cm: registration.shirt_width_cm_snapshot,
      length_cm: registration.shirt_length_cm_snapshot,
      amount: registration.amount,
      paid_at: registration.confirmed_at || payment?.paid_at,
      receipt_url: safePublicHttpsUrl(payment?.receipt_url),
      capture_method: payment?.capture_method,
      installments: payment?.installments,
      transaction_nsu: payment?.transaction_nsu
    });
  } catch (err) {
    console.error("Error in /api/order-status:", err);
    res.status(500).json({ error: "Erro ao consultar status" });
  }
});
apiRouter.post("/payment-check", paymentLimiter, async (req, res) => {
  try {
    const parsed = paymentCheckInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Identificadores do pagamento inv\xE1lidos." });
      return;
    }
    const { order_nsu, transaction_nsu, invoice_slug } = parsed.data;
    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(404).json({ error: "Pagamento n\xE3o encontrado" });
      return;
    }
    if (payment.status === "paid") {
      const reg = db.getRegistrationById(payment.registration_id);
      res.json({
        success: true,
        paid: true,
        status: "confirmed",
        registration: reg
      });
      return;
    }
    const checkResult = await infinitePayProvider.checkPayment(order_nsu, payment, {
      transactionNsu: transaction_nsu,
      invoiceSlug: invoice_slug
    });
    if (checkResult.success && checkResult.paid) {
      if (!checkResult.transactionNsu || checkResult.orderAmount === void 0) {
        res.status(502).json({ error: "A InfinitePay n\xE3o retornou os dados completos da confirma\xE7\xE3o." });
        return;
      }
      const confirmResult = confirmPayment({
        orderNsu: order_nsu,
        transactionNsu: checkResult.transactionNsu,
        orderAmount: checkResult.orderAmount,
        paidAmount: checkResult.paidAmount,
        captureMethod: checkResult.captureMethod,
        installments: checkResult.installments,
        receiptUrl: checkResult.receiptUrl
      });
      if (!confirmResult.success) {
        res.status(confirmResult.conflict ? 409 : 400).json({
          success: false,
          paid: false,
          status: "failed",
          error: confirmResult.error
        });
        return;
      }
      db.updatePayment(payment.id, {
        invoice_slug: checkResult.invoiceSlug
      });
      res.json({
        success: true,
        paid: true,
        status: "confirmed",
        registration: confirmResult.registration
      });
      return;
    }
    res.json({
      success: true,
      paid: false,
      status: payment.status
    });
  } catch (err) {
    console.error("Error in /api/payment-check", {
      code: err instanceof InfinitePayError ? err.code : "internal_error",
      providerStatus: err instanceof InfinitePayError ? err.providerStatus : void 0
    });
    res.status(err instanceof InfinitePayError ? err.httpStatus : 500).json({
      error: err instanceof InfinitePayError ? "N\xE3o foi poss\xEDvel consultar a confirma\xE7\xE3o na InfinitePay." : "Erro ao verificar pagamento"
    });
  }
});
apiRouter.post("/webhook/infinitepay", (req, res) => {
  try {
    const parsed = infinitePayWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Dados da notifica\xE7\xE3o inv\xE1lidos" });
      return;
    }
    const {
      order_nsu,
      amount,
      paid_amount,
      transaction_nsu,
      capture_method,
      installments,
      receipt_url,
      invoice_slug
    } = parsed.data;
    const token = String(req.query.token || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      res.status(400).json({ success: false, message: "Webhook n\xE3o autorizado" });
      return;
    }
    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(400).json({ success: false, message: "Pagamento n\xE3o encontrado" });
      return;
    }
    const calculatedHash = crypto4.createHash("sha256").update(token).digest();
    const expectedHash = Buffer.from(payment.webhook_token_hash, "hex");
    if (calculatedHash.length !== expectedHash.length || !crypto4.timingSafeEqual(calculatedHash, expectedHash)) {
      console.warn("Webhook token verification failed for order_nsu:", order_nsu);
      res.status(400).json({ success: false, message: "Webhook n\xE3o autorizado" });
      return;
    }
    const orderAmount = amount;
    if (orderAmount !== payment.amount) {
      console.error("Webhook amount divergence", {
        orderNsu: String(order_nsu),
        expected: payment.amount,
        received: orderAmount
      });
      res.status(400).json({ success: false, message: "Valor da notifica\xE7\xE3o diverge do esperado" });
      return;
    }
    const result = confirmPayment({
      orderNsu: order_nsu,
      transactionNsu: String(transaction_nsu),
      orderAmount,
      paidAmount: paid_amount,
      captureMethod: capture_method,
      installments: installments ?? 1,
      receiptUrl: receipt_url
    });
    if (!result.success) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }
    if (invoice_slug) {
      db.updatePayment(payment.id, { invoice_slug: String(invoice_slug) });
    }
    res.json({ success: true, message: null });
  } catch (err) {
    console.error("Error in /api/webhook/infinitepay", {
      error: err instanceof Error ? err.name : "unknown"
    });
    res.status(500).json({ success: false, message: "Erro ao processar webhook" });
  }
});
apiRouter.post("/sandbox/simulate-payment", (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" || infinitePayProvider.getMode() !== "sandbox") {
      res.status(404).json({ error: "Rota n\xE3o dispon\xEDvel" });
      return;
    }
    const { order_nsu, token, capture_method = "pix" } = req.body;
    const payment = db.findPaymentByOrderNsu(order_nsu);
    if (!payment) {
      res.status(404).json({ error: "Ordem de pagamento n\xE3o encontrada" });
      return;
    }
    if (token) {
      const calculatedHash = crypto4.createHash("sha256").update(token).digest("hex");
      if (calculatedHash !== payment.webhook_token_hash) {
        res.status(401).json({ error: "Token de checkout inv\xE1lido" });
        return;
      }
    }
    const transactionNsu = `NSU-INF-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const result = confirmPayment({
      orderNsu: order_nsu,
      transactionNsu,
      orderAmount: payment.amount,
      paidAmount: payment.amount,
      captureMethod: capture_method,
      installments: 1,
      receiptUrl: `https://recibo.infinitepay.io/${transactionNsu}`
    });
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({
      success: true,
      message: "Pagamento aprovado com sucesso via InfinitePay",
      transaction_nsu: transactionNsu,
      registration: result.registration
    });
  } catch (err) {
    console.error("Error in /api/sandbox/simulate-payment:", err);
    res.status(500).json({ error: "Erro na simula\xE7\xE3o do pagamento" });
  }
});
apiRouter.post("/admin/login", loginLimiter, (req, res) => {
  try {
    const parsed = loginInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Usu\xE1rio e senha s\xE3o obrigat\xF3rios" });
      return;
    }
    const { username, password } = parsed.data;
    const admin = db.findAdminByUsername(username);
    if (!admin) {
      res.status(401).json({ error: "Usu\xE1rio ou senha incorretos" });
      return;
    }
    if (!verifyPassword(password, admin.password_hash)) {
      res.status(401).json({ error: "Usu\xE1rio ou senha incorretos" });
      return;
    }
    const token = createAdminToken(admin.id);
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Error in /api/admin/login:", err);
    res.status(500).json({ error: "Erro no login" });
  }
});
apiRouter.post("/admin/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.json({ success: true });
});
apiRouter.get("/admin/me", requireAdminAuth, (req, res) => {
  res.json({ user: req.adminUser });
});
apiRouter.get("/admin/dashboard", requireAdminAuth, (req, res) => {
  try {
    const regs = db.getRegistrations();
    const payments = db.getAllData().payments;
    const confirmedRegs = regs.filter((r) => r.status === "confirmed");
    const pendingRegs = regs.filter((r) => r.status === "pending_payment" || r.status === "processing_payment");
    const failedRegs = regs.filter((r) => r.status === "payment_failed");
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const regsToday = regs.filter((r) => r.created_at.startsWith(todayStr));
    const totalRevenueCents = confirmedRegs.reduce((sum, r) => sum + r.amount, 0);
    const totalConfirmedShirts = confirmedRegs.length;
    res.json({
      total_confirmed: confirmedRegs.length,
      waiting_payment: pendingRegs.length,
      registrations_today: regsToday.length,
      total_revenue_cents: totalRevenueCents,
      total_confirmed_shirts: totalConfirmedShirts,
      payment_issues: failedRegs.length,
      recent_registrations: regs.slice(0, 10).map((r) => ({
        ...r,
        payment: payments.find((p) => p.registration_id === r.id)
      }))
    });
  } catch (err) {
    console.error("Error in /api/admin/dashboard:", err);
    res.status(500).json({ error: "Erro ao gerar dados do dashboard" });
  }
});
apiRouter.get("/admin/registrations", requireAdminAuth, (req, res) => {
  try {
    const {
      search,
      unit,
      class_id,
      category,
      size_id,
      status,
      start_date,
      end_date
    } = req.query;
    let list = db.getRegistrations();
    const payments = db.getAllData().payments;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.public_code.toLowerCase().includes(q) || r.participant_name.toLowerCase().includes(q) || r.class_label_snapshot.toLowerCase().includes(q)
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
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "25", 10)));
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);
    const items = paginated.map((r) => {
      const payment = payments.find((p) => p.registration_id === r.id);
      return {
        ...r,
        payment_status: payment?.status || "none",
        transaction_nsu: payment?.transaction_nsu,
        capture_method: payment?.capture_method
      };
    });
    res.json({
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Error in /api/admin/registrations:", err);
    res.status(500).json({ error: "Erro ao listar inscri\xE7\xF5es" });
  }
});
apiRouter.get("/admin/registrations/:id", requireAdminAuth, (req, res) => {
  try {
    const item = db.getRegistrationWithDetails(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    res.json(item);
  } catch (err) {
    console.error("Error in /api/admin/registrations/:id:", err);
    res.status(500).json({ error: "Erro ao buscar detalhes da inscri\xE7\xE3o" });
  }
});
apiRouter.delete("/admin/registrations/:id", requireAdminAuth, (req, res) => {
  try {
    const registration = db.getRegistrationById(req.params.id);
    if (!registration) {
      res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    if (registration.status !== "cancelled") {
      res.status(409).json({ error: "Somente inscri\xE7\xF5es canceladas podem ser exclu\xEDdas." });
      return;
    }
    const hasPaidPayment = db.getAllData().payments.some(
      (payment) => payment.registration_id === registration.id && payment.status === "paid"
    );
    if (hasPaidPayment) {
      res.status(409).json({ error: "A inscri\xE7\xE3o possui um pagamento confirmado e n\xE3o pode ser exclu\xEDda." });
      return;
    }
    if (!db.deleteCancelledRegistration(registration.id)) {
      res.status(409).json({ error: "N\xE3o foi poss\xEDvel excluir a inscri\xE7\xE3o." });
      return;
    }
    res.json({ success: true, message: "Inscri\xE7\xE3o cancelada exclu\xEDda definitivamente." });
  } catch (err) {
    console.error("Error deleting cancelled registration:", err);
    res.status(500).json({ error: "Erro ao excluir a inscri\xE7\xE3o cancelada" });
  }
});
apiRouter.get("/admin/camisas", requireAdminAuth, (req, res) => {
  try {
    const onlyConfirmed = req.query.all !== "true";
    let regs = db.getRegistrations();
    if (onlyConfirmed) {
      regs = regs.filter((r) => r.status === "confirmed");
    }
    const sizes = db.getShirtSizes(false);
    const bySize = {};
    for (const s of sizes) {
      bySize[s.code] = {
        code: s.code,
        name: s.name,
        category: s.category,
        width_cm: s.width_cm,
        length_cm: s.length_cm,
        count: 0
      };
    }
    const byClass = {};
    const byUnit = {};
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
          count: 0
        };
      }
      bySize[code].count += 1;
      if (r.shirt_category_snapshot === "adult") {
        totalAdult += 1;
      } else {
        totalChild += 1;
      }
      const classLabel = r.class_label_snapshot;
      byClass[classLabel] = byClass[classLabel] || { label: classLabel, count: 0 };
      byClass[classLabel].count += 1;
      const unitMatch = classLabel.match(/UNIDADE\s+([^-]+)/i);
      const unitName = unitMatch ? unitMatch[1].trim() : "Outras";
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
      by_unit: Object.values(byUnit).sort((a, b) => b.count - a.count)
    });
  } catch (err) {
    console.error("Error in /api/admin/camisas:", err);
    res.status(500).json({ error: "Erro ao gerar relat\xF3rio de camisetas" });
  }
});
apiRouter.get("/api/admin/export", requireAdminAuth, (req, res) => {
  try {
    const regs = db.getRegistrations();
    const allAnswers = db.getAllData().registration_answers;
    const payments = db.getAllData().payments;
    const customLabelsSet = /* @__PURE__ */ new Set();
    for (const ans of allAnswers) {
      if (ans.field_key_snapshot !== "full_name" && ans.field_key_snapshot !== "class_id" && ans.field_key_snapshot !== "shirt_size_id") {
        customLabelsSet.add(ans.label_snapshot);
      }
    }
    const customLabels = Array.from(customLabelsSet);
    const headers = [
      "C\xF3digo",
      "Status",
      "Data Inscri\xE7\xE3o",
      "Nome Completo",
      "Unidade/Turma",
      "Tamanho Camiseta",
      "Categoria",
      "Largura (cm)",
      "Comprimento (cm)",
      "Qtd",
      "Valor (R$)",
      "Situa\xE7\xE3o Pagamento",
      "NSU Transa\xE7\xE3o",
      "Forma Pagamento",
      "Data Pagamento",
      "Comprovante",
      ...customLabels
    ];
    const escapeCSV = (val) => {
      if (val === void 0 || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = regs.map((r) => {
      const regAnswers = allAnswers.filter((a) => a.registration_id === r.id);
      const payment = payments.find((p) => p.registration_id === r.id);
      const statusMap = {
        confirmed: "Confirmada",
        pending_payment: "Aguardando Pagamento",
        processing_payment: "Processando Pagamento",
        payment_failed: "Falha no Pagamento",
        expired: "Expirada",
        cancelled: "Cancelada"
      };
      const dateStr = new Date(r.created_at).toLocaleString("pt-BR");
      const paidDateStr = payment?.paid_at ? new Date(payment.paid_at).toLocaleString("pt-BR") : "";
      const rowValues = [
        r.public_code,
        statusMap[r.status] || r.status,
        dateStr,
        r.participant_name,
        r.class_label_snapshot,
        r.shirt_size_code_snapshot,
        r.shirt_category_snapshot === "adult" ? "Adulto" : "Infantil",
        r.shirt_width_cm_snapshot,
        r.shirt_length_cm_snapshot,
        1,
        (r.amount / 100).toFixed(2).replace(".", ","),
        payment?.status === "paid" ? "Pago" : payment?.status || "Pendente",
        payment?.transaction_nsu || "",
        payment?.capture_method || "",
        paidDateStr,
        payment?.receipt_url || ""
      ];
      for (const label of customLabels) {
        const found = regAnswers.find((a) => a.label_snapshot === label);
        rowValues.push(found ? found.value : "");
      }
      return rowValues.map(escapeCSV).join(";");
    });
    const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(";"), ...rows].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="inscricoes-ultra-volleyball.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ error: "Erro ao gerar exporta\xE7\xE3o" });
  }
});
apiRouter.get("/admin/export", requireAdminAuth, (req, res) => {
  const regs = db.getRegistrations();
  const allAnswers = db.getAllData().registration_answers;
  const payments = db.getAllData().payments;
  const customLabelsSet = /* @__PURE__ */ new Set();
  for (const ans of allAnswers) {
    if (ans.field_key_snapshot !== "full_name" && ans.field_key_snapshot !== "class_id" && ans.field_key_snapshot !== "shirt_size_id") {
      customLabelsSet.add(ans.label_snapshot);
    }
  }
  const customLabels = Array.from(customLabelsSet);
  const headers = [
    "C\xF3digo",
    "Status",
    "Data Inscri\xE7\xE3o",
    "Nome Completo",
    "Unidade/Turma",
    "Tamanho Camiseta",
    "Categoria",
    "Largura (cm)",
    "Comprimento (cm)",
    "Qtd",
    "Valor (R$)",
    "Situa\xE7\xE3o Pagamento",
    "NSU Transa\xE7\xE3o",
    "Forma Pagamento",
    "Data Pagamento",
    "Comprovante",
    ...customLabels
  ];
  const escapeCSV = (val) => {
    if (val === void 0 || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const rows = regs.map((r) => {
    const regAnswers = allAnswers.filter((a) => a.registration_id === r.id);
    const payment = payments.find((p) => p.registration_id === r.id);
    const statusMap = {
      confirmed: "Confirmada",
      pending_payment: "Aguardando Pagamento",
      processing_payment: "Processando Pagamento",
      payment_failed: "Falha no Pagamento",
      expired: "Expirada",
      cancelled: "Cancelada"
    };
    const dateStr = new Date(r.created_at).toLocaleString("pt-BR");
    const paidDateStr = payment?.paid_at ? new Date(payment.paid_at).toLocaleString("pt-BR") : "";
    const rowValues = [
      r.public_code,
      statusMap[r.status] || r.status,
      dateStr,
      r.participant_name,
      r.class_label_snapshot,
      r.shirt_size_code_snapshot,
      r.shirt_category_snapshot === "adult" ? "Adulto" : "Infantil",
      r.shirt_width_cm_snapshot,
      r.shirt_length_cm_snapshot,
      1,
      (r.amount / 100).toFixed(2).replace(".", ","),
      payment?.status === "paid" ? "Pago" : payment?.status || "Pendente",
      payment?.transaction_nsu || "",
      payment?.capture_method || "",
      paidDateStr,
      payment?.receipt_url || ""
    ];
    for (const label of customLabels) {
      const found = regAnswers.find((a) => a.label_snapshot === label);
      rowValues.push(found ? found.value : "");
    }
    return rowValues.map(escapeCSV).join(";");
  });
  const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(";"), ...rows].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="inscricoes-ultra-volleyball.csv"');
  res.send(csvContent);
});
apiRouter.get("/admin/form-fields", requireAdminAuth, (req, res) => {
  res.json(db.getFormFields(false));
});
apiRouter.post("/admin/form-fields", requireAdminAuth, (req, res) => {
  try {
    const { label, description, field_type, placeholder, required, options } = req.body;
    if (!label || !field_type) {
      res.status(400).json({ error: "Pergunta e tipo s\xE3o obrigat\xF3rios" });
      return;
    }
    const key = `custom_${Date.now()}_${label.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 15)}`;
    const count = db.getFormFields(false).length;
    const newField = db.createFormField({
      key,
      label,
      description: description || "",
      field_type,
      placeholder: placeholder || "",
      required: Boolean(required),
      active: true,
      sort_order: count + 1,
      options: Array.isArray(options) ? options : []
    });
    res.status(201).json(newField);
  } catch (err) {
    console.error("Error creating form field:", err);
    res.status(500).json({ error: "Erro ao criar pergunta" });
  }
});
apiRouter.put("/admin/form-fields/:id", requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateFormField(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Pergunta n\xE3o encontrada" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating form field:", err);
    res.status(500).json({ error: "Erro ao atualizar pergunta" });
  }
});
apiRouter.post("/admin/form-fields/reorder", requireAdminAuth, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: "Array de IDs inv\xE1lido" });
      return;
    }
    db.reorderFormFields(ids);
    res.json(db.getFormFields(false));
  } catch (err) {
    console.error("Error reordering fields:", err);
    res.status(500).json({ error: "Erro ao reordenar campos" });
  }
});
apiRouter.get("/admin/classes", requireAdminAuth, (req, res) => {
  res.json(db.getClasses(false));
});
apiRouter.post("/admin/classes", requireAdminAuth, (req, res) => {
  try {
    const { display_label, unit, category, gender, level, weekday, start_time } = req.body;
    if (!display_label) {
      res.status(400).json({ error: "Nome/descri\xE7\xE3o da turma \xE9 obrigat\xF3rio" });
      return;
    }
    const count = db.getClasses(false).length;
    const newClass = db.createClass({
      display_label,
      unit: unit || "GERAL",
      category: category || "GERAL",
      gender: gender || "MISTO",
      level: level || "GERAL",
      weekday: weekday || "",
      start_time: start_time || "",
      active: true,
      sort_order: count + 1
    });
    res.status(201).json(newClass);
  } catch (err) {
    console.error("Error creating class:", err);
    res.status(500).json({ error: "Erro ao criar turma" });
  }
});
apiRouter.put("/admin/classes/:id", requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateClass(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Turma n\xE3o encontrada" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating class:", err);
    res.status(500).json({ error: "Erro ao atualizar turma" });
  }
});
apiRouter.get("/admin/shirt-sizes", requireAdminAuth, (req, res) => {
  res.json(db.getShirtSizes(false));
});
apiRouter.post("/admin/shirt-sizes", requireAdminAuth, (req, res) => {
  try {
    const { code, name, width_cm, length_cm, category } = req.body;
    if (!code || !width_cm || !length_cm || !category) {
      res.status(400).json({ error: "C\xF3digo, largura, comprimento e categoria s\xE3o obrigat\xF3rios" });
      return;
    }
    const count = db.getShirtSizes(false).length;
    const newSize = db.createShirtSize({
      code,
      name: name || `${code} ${category === "adult" ? "Adulto" : "Infantil"}`,
      width_cm: Number(width_cm),
      length_cm: Number(length_cm),
      category: category === "child" ? "child" : "adult",
      active: true,
      sort_order: count + 1
    });
    res.status(201).json(newSize);
  } catch (err) {
    console.error("Error creating shirt size:", err);
    res.status(500).json({ error: "Erro ao criar tamanho" });
  }
});
apiRouter.put("/admin/shirt-sizes/:id", requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateShirtSize(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Tamanho n\xE3o encontrado" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating shirt size:", err);
    res.status(500).json({ error: "Erro ao atualizar tamanho" });
  }
});
apiRouter.get("/admin/settings", requireAdminAuth, (req, res) => {
  const productionRuntime = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
  res.json({
    shirt_price: db.getShirtPrice(),
    infinitepay_handle: productionRuntime ? infinitePayProvider.getHandle() : db.getSetting("infinitepay_handle", process.env.INFINITEPAY_HANDLE || ""),
    infinitepay_mode: productionRuntime ? "production" : db.getSetting("infinitepay_mode", "production"),
    infinitepay_managed_by_environment: productionRuntime
  });
});
apiRouter.put("/admin/settings/infinitepay", requireAdminAuth, (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" || process.env.CONTEXT === "production") {
      res.status(400).json({
        error: "Em produ\xE7\xE3o, altere INFINITEPAY_HANDLE nas vari\xE1veis de ambiente da Netlify."
      });
      return;
    }
    const { handle, mode } = req.body;
    if (handle !== void 0) {
      const cleanHandle = String(handle).replace(/^[$@]+/, "").trim();
      db.setSetting("infinitepay_handle", cleanHandle);
    }
    if (mode && (mode === "production" || mode === "sandbox")) {
      if (process.env.NODE_ENV === "production" && mode !== "production") {
        res.status(400).json({ error: "O modo sandbox n\xE3o pode ser ativado em produ\xE7\xE3o." });
        return;
      }
      db.setSetting("infinitepay_mode", mode);
    }
    res.json({
      success: true,
      infinitepay_handle: db.getSetting("infinitepay_handle", process.env.INFINITEPAY_HANDLE || ""),
      infinitepay_mode: db.getSetting("infinitepay_mode", "production")
    });
  } catch (err) {
    console.error("Error updating InfinitePay settings:", err);
    res.status(500).json({ error: "Erro ao atualizar configura\xE7\xF5es InfinitePay" });
  }
});
apiRouter.post("/admin/registrations/:id/confirm-payment", requireAdminAuth, (req, res) => {
  try {
    const { transaction_nsu, capture_method = "pix" } = req.body;
    const manualTransactionNsu = String(transaction_nsu || "").trim();
    if (!manualTransactionNsu) {
      res.status(400).json({ error: "Informe o NSU real da transa\xE7\xE3o para confirmar manualmente." });
      return;
    }
    const reg = db.getRegistrationById(req.params.id);
    if (!reg) {
      res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    let payment = db.getPaymentByRegistrationId(reg.id);
    if (!payment) {
      const order_nsu = generateUUID();
      payment = db.createPayment({
        registration_id: reg.id,
        provider: "infinitepay",
        attempt_id: `manual_${Date.now()}`,
        order_nsu,
        status: "pending",
        amount: reg.amount,
        checkout_url: "",
        webhook_token_hash: ""
      });
    }
    const result = confirmPayment({
      orderNsu: payment.order_nsu,
      transactionNsu: manualTransactionNsu,
      orderAmount: reg.amount,
      paidAmount: reg.amount,
      captureMethod: capture_method,
      installments: 1
    });
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({
      success: true,
      message: "Inscri\xE7\xE3o e pagamento confirmados manualmente com sucesso.",
      registration: result.registration
    });
  } catch (err) {
    console.error("Error confirming payment manually:", err);
    res.status(500).json({ error: "Erro ao confirmar pagamento manualmente" });
  }
});
apiRouter.post("/admin/registrations/:id/cancel-payment", requireAdminAuth, (req, res) => {
  try {
    const registration = db.getRegistrationById(req.params.id);
    if (!registration) {
      res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      return;
    }
    const payment = db.getPaymentByRegistrationId(registration.id);
    if (registration.status === "confirmed" || payment?.status === "paid") {
      res.status(409).json({ error: "Um pagamento confirmado n\xE3o pode ser cancelado por esta a\xE7\xE3o." });
      return;
    }
    if (registration.status === "cancelled") {
      res.json({
        success: true,
        reused: true,
        message: "A pend\xEAncia desta inscri\xE7\xE3o j\xE1 estava cancelada.",
        registration,
        payment
      });
      return;
    }
    const cancelledPayment = payment ? db.updatePayment(payment.id, {
      status: "cancelled",
      error: "Pend\xEAncia cancelada manualmente pelo administrador."
    }) : void 0;
    db.updateRegistrationStatus(registration.id, "cancelled");
    res.json({
      success: true,
      message: "Pend\xEAncia de pagamento cancelada com sucesso.",
      registration: db.getRegistrationById(registration.id),
      payment: cancelledPayment
    });
  } catch (err) {
    console.error("Error cancelling payment manually:", err);
    res.status(500).json({ error: "Erro ao cancelar a pend\xEAncia de pagamento" });
  }
});
apiRouter.put("/admin/settings/price", requireAdminAuth, (req, res) => {
  try {
    const { shirt_price } = req.body;
    const priceCents = parseInt(shirt_price, 10);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      res.status(400).json({ error: "Valor da camiseta inv\xE1lido (deve ser em centavos positivos)." });
      return;
    }
    db.setSetting("shirt_price", String(priceCents));
    res.json({
      success: true,
      shirt_price: priceCents,
      formatted: `R$ ${(priceCents / 100).toFixed(2).replace(".", ",")}`
    });
  } catch (err) {
    console.error("Error setting shirt price:", err);
    res.status(500).json({ error: "Erro ao atualizar valor da camiseta" });
  }
});
apiRouter.put("/admin/settings/password", requireAdminAuth, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 12) {
      res.status(400).json({ error: "A nova senha deve ter no m\xEDnimo 12 caracteres." });
      return;
    }
    const admin = db.findAdminById(req.adminUser.id);
    if (!admin) {
      res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      return;
    }
    if (!verifyPassword(current_password, admin.password_hash)) {
      res.status(400).json({ error: "Senha atual incorreta" });
      return;
    }
    db.updateAdminPassword(admin.id, hashPassword(new_password));
    res.json({ success: true, message: "Senha atualizada com sucesso" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
});

// server.ts
async function startServer() {
  validateRuntimeConfig();
  const app = express();
  const PORT = Number(process.env.PORT || 3e3);
  const isProd = process.env.NODE_ENV === "production";
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT deve ser um n\xFAmero inteiro entre 1 e 65535");
  }
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true, limit: "64kb" }));
  app.use(cookieParser());
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api", apiRouter);
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Ultra Volleyball Server] Running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
