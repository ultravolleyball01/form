export type RegistrationStatus =
  | 'pending_payment'
  | 'processing_payment'
  | 'confirmed'
  | 'payment_failed'
  | 'expired'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface SystemSettings {
  id: string;
  key: string;
  value: string; // e.g. "6000" for shirt_price in cents
  updated_at: string;
}

export interface ClassItem {
  id: string;
  display_label: string;
  unit: string;
  category: string;
  gender: string;
  level: string;
  weekday: string;
  start_time: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShirtSize {
  id: string;
  code: string;
  name: string;
  width_cm: number;
  length_cm: number;
  category: 'adult' | 'child';
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'
  | 'class_selector'
  | 'shirt_size_selector';

export interface FormField {
  id: string;
  key: string;
  label: string;
  description?: string;
  field_type: FormFieldType;
  placeholder?: string;
  required: boolean;
  active: boolean;
  sort_order: number;
  options?: string[]; // For select, radio, checkbox
  system_type?: 'full_name' | 'class_id' | 'shirt_size_id';
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  public_code: string;
  participant_name: string;
  class_id: string;
  class_label_snapshot: string;
  shirt_size_id: string;
  shirt_size_code_snapshot: string;
  shirt_width_cm_snapshot: number;
  shirt_length_cm_snapshot: number;
  shirt_category_snapshot: 'adult' | 'child';
  shirt_quantity: 1;
  amount: number; // in centavos, e.g. 6000
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
}

export interface RegistrationAnswer {
  id: string;
  registration_id: string;
  field_id: string;
  field_key_snapshot: string;
  label_snapshot: string;
  value: string;
  created_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  provider: 'infinitepay';
  attempt_id: string;
  order_nsu: string;
  transaction_nsu?: string;
  invoice_slug?: string;
  status: PaymentStatus;
  amount: number; // in centavos, e.g. 6000
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
  checkout_url: string;
  receipt_url?: string;
  webhook_token_hash: string;
  error?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin';
  name: string;
  created_at: string;
}

export interface RegistrationWithDetails extends Registration {
  answers: RegistrationAnswer[];
  payment?: Payment;
}

export interface PublicFormConfig {
  shirt_price: number;
  form_fields: FormField[];
  classes: ClassItem[];
  shirt_sizes: ShirtSize[];
}
