import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type {
  AdminUser,
  ClassItem,
  FormAppearance,
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

const SELECTION_SCHEDULE: Omit<ClassItem, 'id' | 'created_at' | 'updated_at'>[] = [
  { display_label: '08/dez • 20:30 às 22:00 • FEMININO SUB 17/19 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 17/19', gender: 'FEMININO', level: 'SELETIVA', weekday: '08/dez', start_time: '20:30–22:00', eligible_birth_years: [2009, 2010, 2011, 2012], active: true, sort_order: 1 },
  { display_label: '09/dez • 15:00 às 16:30 • FEMININO SUB 13 • BSC', unit: 'BSC', category: 'SUB 13', gender: 'FEMININO', level: 'SELETIVA', weekday: '09/dez', start_time: '15:00–16:30', eligible_birth_years: [2015, 2016], active: true, sort_order: 2 },
  { display_label: '09/dez • 16:30 às 18:00 • FEMININO SUB 15 • BSC', unit: 'BSC', category: 'SUB 15', gender: 'FEMININO', level: 'SELETIVA', weekday: '09/dez', start_time: '16:30–18:00', eligible_birth_years: [2013, 2014], active: true, sort_order: 3 },
  { display_label: '09/dez • 19:00 às 20:30 • MASCULINO SUB 17 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 17', gender: 'MASCULINO', level: 'SELETIVA', weekday: '09/dez', start_time: '19:00–20:30', eligible_birth_years: [2011, 2012], active: true, sort_order: 4 },
  { display_label: '09/dez • 20:30 às 22:00 • MASCULINO SUB 19 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 19', gender: 'MASCULINO', level: 'SELETIVA', weekday: '09/dez', start_time: '20:30–22:00', eligible_birth_years: [2009, 2010], active: true, sort_order: 5 },
  { display_label: '11/dez • 09:30 às 11:00 • FEMININO/MASCULINO SUB 11 • BSC', unit: 'BSC', category: 'SUB 11', gender: 'FEMININO/MASCULINO', level: 'SELETIVA', weekday: '11/dez', start_time: '09:30–11:00', eligible_birth_years: [2017, 2018], active: true, sort_order: 6 },
  { display_label: '11/dez • 13:30 às 15:00 • MASCULINO SUB 13 • BSC', unit: 'BSC', category: 'SUB 13', gender: 'MASCULINO', level: 'SELETIVA', weekday: '11/dez', start_time: '13:30–15:00', eligible_birth_years: [2015, 2016], active: true, sort_order: 7 },
  { display_label: '11/dez • 15:00 às 16:30 • MASCULINO SUB 15 • BSC', unit: 'BSC', category: 'SUB 15', gender: 'MASCULINO', level: 'SELETIVA', weekday: '11/dez', start_time: '15:00–16:30', eligible_birth_years: [2013, 2014], active: true, sort_order: 8 },
  { display_label: '11/dez • 16:30 às 18:00 • FEMININO SUB 15 • BSC', unit: 'BSC', category: 'SUB 15', gender: 'FEMININO', level: 'SELETIVA', weekday: '11/dez', start_time: '16:30–18:00', eligible_birth_years: [2013, 2014], active: true, sort_order: 9 },
  { display_label: '14/dez • 15:00 às 16:30 • MASCULINO SUB 13 • BSC', unit: 'BSC', category: 'SUB 13', gender: 'MASCULINO', level: 'SELETIVA', weekday: '14/dez', start_time: '15:00–16:30', eligible_birth_years: [2015, 2016], active: true, sort_order: 10 },
  { display_label: '15/dez • 20:30 às 22:00 • FEMININO SUB 17/19 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 17/19', gender: 'FEMININO', level: 'SELETIVA', weekday: '15/dez', start_time: '20:30–22:00', eligible_birth_years: [2009, 2010, 2011, 2012], active: true, sort_order: 11 },
  { display_label: '16/dez • 08:00 às 09:30 • FEMININO/MASCULINO SUB 11 • BSC', unit: 'BSC', category: 'SUB 11', gender: 'FEMININO/MASCULINO', level: 'SELETIVA', weekday: '16/dez', start_time: '08:00–09:30', eligible_birth_years: [2017, 2018], active: true, sort_order: 12 },
  { display_label: '16/dez • 15:00 às 16:30 • FEMININO SUB 13 • BSC', unit: 'BSC', category: 'SUB 13', gender: 'FEMININO', level: 'SELETIVA', weekday: '16/dez', start_time: '15:00–16:30', eligible_birth_years: [2015, 2016], active: true, sort_order: 13 },
  { display_label: '16/dez • 16:30 às 18:00 • MASCULINO SUB 15 • BSC', unit: 'BSC', category: 'SUB 15', gender: 'MASCULINO', level: 'SELETIVA', weekday: '16/dez', start_time: '16:30–18:00', eligible_birth_years: [2013, 2014], active: true, sort_order: 14 },
  { display_label: '16/dez • 19:00 às 20:30 • MASCULINO SUB 17 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 17', gender: 'MASCULINO', level: 'SELETIVA', weekday: '16/dez', start_time: '19:00–20:30', eligible_birth_years: [2011, 2012], active: true, sort_order: 15 },
  { display_label: '16/dez • 20:30 às 22:00 • MASCULINO SUB 19 • COLÉGIO', unit: 'COLÉGIO', category: 'SUB 19', gender: 'MASCULINO', level: 'SELETIVA', weekday: '16/dez', start_time: '20:30–22:00', eligible_birth_years: [2009, 2010], active: true, sort_order: 16 },
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

const FORM_SETTING_DEFAULTS: Record<string, string> = {
  form_eyebrow: 'PENEIRA ULTRA VOLLEYBALL',
  form_title: 'Seleção de atletas',
  form_description:
    'Cadastre-se para participar da peneira. Escolha o local e o horário disponíveis e conte um pouco sobre sua experiência no vôlei.',
  form_primary_logo_url: '',
  form_secondary_logo_url: '',
  form_header_banner_url: '/assets/seletivas-batalha-2027.png',
  form_submit_label: 'Confirmar inscrição',
  form_success_title: 'Inscrição recebida!',
  form_success_description:
    'Seu cadastro para a peneira foi realizado. Guarde o código da inscrição e aguarde as orientações da equipe Ultra.',
  form_payment_enabled: 'false',
  form_maps_enabled: 'true',
  form_maps_bsc_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.640436636719!2d-46.50963532474073!3d-23.545431461007226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce67521357b17b%3A0x234b765aea113e15!2sGrupo%20Batalha%20-%20Academia%20Vila%20Matilde!5e0!3m2!1spt-BR!2sbr!4v1794359798576!5m2!1spt-BR!2sbr',
  form_maps_colegio_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.640436636719!2d-46.50963532474073!3d-23.545431461007226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce67521357b17b%3A0x234b765aea113e15!2sGrupo%20Batalha%20-%20Academia%20Vila%20Matilde!5e0!3m2!1spt-BR!2sbr!4v1794359798576!5m2!1spt-BR!2sbr',
  form_location_bsc_address: '',
  form_location_colegio_address: '',
};

function ensureGeneralFormDefaults(source: DatabaseSchema): DatabaseSchema {
  const data = structuredClone(source);
  const now = new Date().toISOString();
  const getSetting = (key: string) => data.system_settings.find((item) => item.key === key);
  const addSetting = (key: string, value: string) => {
    if (!getSetting(key)) {
      data.system_settings.push({ id: generateUUID(), key, value, updated_at: now });
    }
  };
  const setSetting = (key: string, value: string) => {
    const existing = getSetting(key);
    if (existing) {
      existing.value = value;
      existing.updated_at = now;
    } else {
      addSetting(key, value);
    }
  };

  Object.entries(FORM_SETTING_DEFAULTS).forEach(([key, value]) => addSetting(key, value));

  // One-time migration from the API-key placeholder to the simpler Maps embed.
  if (!getSetting('google_maps_embed_version')) {
    setSetting('form_maps_enabled', 'true');
    setSetting('form_maps_bsc_embed_url', FORM_SETTING_DEFAULTS.form_maps_bsc_embed_url);
    setSetting('form_maps_colegio_embed_url', FORM_SETTING_DEFAULTS.form_maps_colegio_embed_url);
    addSetting('google_maps_embed_version', '1');
  }

  // The existing database belongs to the previous shirt-registration form.
  // Archive that snapshot once so the athlete-selection operation starts clean.
  if (!getSetting('pre_selection_registrations_archive_version')) {
    for (const registration of data.registrations) {
      registration.archived_at ||= now;
      registration.updated_at = now;
    }
    addSetting('pre_selection_registrations_archive_version', '1');
  }

  if (!getSetting('general_form_version')) {
    const fullName = data.form_fields.find((field) => field.key === 'full_name');
    if (fullName) {
      fullName.label = 'Nome completo do(a) atleta';
      fullName.description = 'Use o nome completo que consta no documento';
      fullName.placeholder = 'Ex: Ana Carolina Silva';
      fullName.active = true;
      fullName.required = true;
      fullName.sort_order = 1;
      fullName.updated_at = now;
    }

    const classField = data.form_fields.find((field) => field.key === 'class_id');
    if (classField) {
      classField.label = 'Local e horário da peneira';
      classField.description = 'Escolha uma das opções disponíveis para participar da seleção';
      classField.placeholder = 'Selecione o local e o horário...';
      classField.active = true;
      classField.required = true;
      classField.sort_order = 6;
      classField.updated_at = now;
    }

    const shirtField = data.form_fields.find((field) => field.key === 'shirt_size_id');
    if (shirtField) {
      shirtField.active = false;
      shirtField.required = false;
      shirtField.sort_order = 90;
      shirtField.updated_at = now;
    }

    const ensureField = (
      key: string,
      input: Omit<FormField, 'id' | 'key' | 'created_at' | 'updated_at'>
    ): FormField => {
      const existing = data.form_fields.find((field) => field.key === key);
      if (existing) return existing;
      const created: FormField = {
        ...input,
        id: generateUUID(),
        key,
        created_at: now,
        updated_at: now,
      };
      data.form_fields.push(created);
      return created;
    };

    const birthYear = ensureField('birth_year', {
      label: 'Ano de nascimento',
      description: 'Informe os quatro dígitos do ano de nascimento',
      field_type: 'number',
      placeholder: 'Ex: 2008',
      required: true,
      active: true,
      sort_order: 2,
    });

    ensureField('guardian_name', {
      label: 'Nome completo do responsável',
      description: 'Exibido para atletas nascidos em 2009 ou depois',
      field_type: 'text',
      placeholder: 'Nome do pai, mãe ou responsável legal',
      required: true,
      active: true,
      sort_order: 3,
      show_when: {
        field_id: birthYear.id,
        operator: 'greater_than_or_equal',
        value: '2009',
      },
    });

    ensureField('phone', {
      label: 'WhatsApp para contato',
      description: 'Inclua o DDD',
      field_type: 'phone',
      placeholder: '(11) 99999-9999',
      required: true,
      active: true,
      sort_order: 4,
    });

    ensureField('email', {
      label: 'E-mail',
      description: 'Usaremos este e-mail para comunicações sobre a peneira',
      field_type: 'email',
      placeholder: 'voce@exemplo.com',
      required: true,
      active: true,
      sort_order: 5,
    });

    ensureField('volleyball_experience', {
      label: 'Experiência com vôlei',
      description: 'Conte onde já jogou, por quanto tempo e sua posição preferida',
      field_type: 'textarea',
      placeholder: 'Ex: jogo há 3 anos como ponteiro...',
      required: false,
      active: true,
      sort_order: 7,
    });

    data.form_fields
      .filter((field) => !['full_name', 'birth_year', 'guardian_name', 'phone', 'email', 'class_id', 'volleyball_experience', 'shirt_size_id'].includes(field.key))
      .forEach((field, index) => {
        field.sort_order = 20 + index;
      });

    addSetting('general_form_version', '1');
  }

  if (Number(getSetting('selection_schedule_version')?.value || '0') < 2) {
    const ensureSelectionField = (
      key: string,
      input: Omit<FormField, 'id' | 'key' | 'created_at' | 'updated_at'>
    ): FormField => {
      const existing = data.form_fields.find((field) => field.key === key);
      if (existing) {
        Object.assign(existing, input, { updated_at: now });
        return existing;
      }
      const created: FormField = { ...input, id: generateUUID(), key, created_at: now, updated_at: now };
      data.form_fields.push(created);
      return created;
    };

    ensureSelectionField('full_name', {
      label: 'Nome completo do(a) atleta', description: 'Informe como consta no documento', field_type: 'text',
      placeholder: 'Ex: Ana Carolina Silva', required: true, active: true, sort_order: 1, system_type: 'full_name',
    });
    ensureSelectionField('guardian_name', {
      label: 'Nome completo do responsável', description: 'Responsável legal pelo(a) atleta', field_type: 'text',
      placeholder: 'Nome do pai, mãe ou responsável', required: true, active: true, sort_order: 2, show_when: null,
    });
    ensureSelectionField('phone', {
      label: 'WhatsApp para contato', description: 'Inclua o DDD', field_type: 'phone',
      placeholder: '(11) 99999-9999', required: true, active: true, sort_order: 3,
    });
    ensureSelectionField('rg', {
      label: 'RG do(a) atleta', description: 'Uso exclusivo desta inscrição; será permitido apenas um cadastro por RG', field_type: 'text',
      placeholder: 'Digite somente números', required: true, active: true, sort_order: 4,
    });
    ensureSelectionField('birth_year', {
      label: 'Ano de nascimento', description: 'Os horários disponíveis serão filtrados automaticamente', field_type: 'number',
      placeholder: 'Ex: 2014', required: true, active: true, sort_order: 5,
    });
    ensureSelectionField('class_id', {
      label: 'Dia e horário da seletiva', description: 'Exibimos apenas as opções permitidas para o ano de nascimento informado',
      field_type: 'class_selector', placeholder: 'Selecione um dia e horário...', required: true,
      active: true, sort_order: 6, system_type: 'class_id',
    });

    data.form_fields.forEach((field) => {
      if (!['full_name', 'guardian_name', 'phone', 'rg', 'birth_year', 'class_id'].includes(field.key)) {
        field.active = false;
        field.required = false;
        field.updated_at = now;
      }
    });

    data.classes = SELECTION_SCHEDULE.map((item) => ({
      ...item, id: generateUUID(), created_at: now, updated_at: now,
    }));

    setSetting('form_eyebrow', 'TEMPORADA 2027 • SELETIVAS EM DEZEMBRO');
    setSetting('form_title', 'Seletivas Batalha Ultra Volleyball');
    setSetting('form_description', 'Preencha os dados do atleta. O sistema mostrará somente os dias e horários compatíveis com o ano de nascimento.');
    setSetting('form_header_banner_url', '/assets/seletivas-batalha-2027.png');
    setSetting('form_submit_label', 'Confirmar inscrição na seletiva');
    setSetting('form_success_title', 'Inscrição na seletiva recebida!');
    setSetting('form_success_description', 'Guarde seu código de inscrição e compareça no local escolhido com antecedência.');
    setSetting('form_payment_enabled', 'false');
    setSetting('selection_schedule_version', '2');
  }

  if (Number(getSetting('selection_schedule_version')?.value || '0') < 3) {
    const existingGender = data.form_fields.find((field) => field.key === 'selection_gender');
    if (existingGender) {
      Object.assign(existingGender, {
        label: 'Categoria da seletiva',
        description: 'Selecione a categoria para filtrar os horários',
        field_type: 'select' as const,
        placeholder: 'Selecione',
        required: true,
        active: true,
        sort_order: 6,
        options: ['Masculino', 'Feminino'],
        updated_at: now,
      });
    } else {
      data.form_fields.push({
        id: generateUUID(),
        key: 'selection_gender',
        label: 'Categoria da seletiva',
        description: 'Selecione a categoria para filtrar os horários',
        field_type: 'select',
        placeholder: 'Selecione',
        required: true,
        active: true,
        sort_order: 6,
        options: ['Masculino', 'Feminino'],
        created_at: now,
        updated_at: now,
      });
    }

    const classField = data.form_fields.find((field) => field.key === 'class_id');
    if (classField) {
      classField.sort_order = 7;
      classField.description = 'Exibimos apenas as opções permitidas para o ano de nascimento e a categoria informados';
      classField.updated_at = now;
    }
    setSetting('selection_schedule_version', '3');
  }

  if (Number(getSetting('selection_schedule_version')?.value || '0') < 4) {
    const birthYearField = data.form_fields.find((field) => field.key === 'birth_year');
    if (birthYearField) {
      Object.assign(birthYearField, {
        label: 'Ano de nascimento',
        description: 'Selecione um dos anos aceitos na seletiva',
        field_type: 'select' as const,
        placeholder: 'Selecione o ano de nascimento',
        required: true,
        active: true,
        options: ['2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009'],
        updated_at: now,
      });
    }
    setSetting('selection_schedule_version', '4');
  }

  return data;
}

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
        const upgraded = ensureGeneralFormDefaults(JSON.parse(content));
        this.saveData(upgraded);
        return upgraded;
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

    const upgraded = ensureGeneralFormDefaults(seeded);
    if (!this.managedDatabase) {
      this.saveData(upgraded);
    }
    return upgraded;
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
    this.data = ensureGeneralFormDefaults(data);
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

  public getFormAppearance(): FormAppearance {
    return {
      eyebrow: this.getSetting('form_eyebrow', FORM_SETTING_DEFAULTS.form_eyebrow),
      title: this.getSetting('form_title', FORM_SETTING_DEFAULTS.form_title),
      description: this.getSetting('form_description', FORM_SETTING_DEFAULTS.form_description),
      primary_logo_url: this.getSetting('form_primary_logo_url', ''),
      secondary_logo_url: this.getSetting('form_secondary_logo_url', ''),
      header_banner_url: this.getSetting('form_header_banner_url', ''),
      submit_label: this.getSetting('form_submit_label', FORM_SETTING_DEFAULTS.form_submit_label),
      success_title: this.getSetting('form_success_title', FORM_SETTING_DEFAULTS.form_success_title),
      success_description: this.getSetting(
        'form_success_description',
        FORM_SETTING_DEFAULTS.form_success_description
      ),
      payment_enabled: this.getSetting('form_payment_enabled', 'false') === 'true',
      maps_enabled: this.getSetting('form_maps_enabled', 'false') === 'true',
      maps_bsc_embed_url: this.getSetting(
        'form_maps_bsc_embed_url',
        FORM_SETTING_DEFAULTS.form_maps_bsc_embed_url
      ),
      maps_colegio_embed_url: this.getSetting(
        'form_maps_colegio_embed_url',
        FORM_SETTING_DEFAULTS.form_maps_colegio_embed_url
      ),
      location_bsc_address: this.getSetting('form_location_bsc_address', ''),
      location_colegio_address: this.getSetting('form_location_colegio_address', ''),
    };
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
    return this.data.registrations.some((r) => r.class_id === classId && !r.archived_at);
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

  public findRegistrationByAnswer(fieldKey: string, value: string): Registration | undefined {
    const answer = this.data.registration_answers.find(
      (item) => {
        if (item.field_key_snapshot !== fieldKey || item.value !== value) return false;
        const registration = this.data.registrations.find((entry) => entry.id === item.registration_id);
        return Boolean(registration && !registration.archived_at);
      }
    );
    return answer ? this.getRegistrationById(answer.registration_id) : undefined;
  }

  public getRegistrations(includeArchived = false): Registration[] {
    return this.data.registrations.filter((item) => includeArchived || !item.archived_at).sort((a, b) => {
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
