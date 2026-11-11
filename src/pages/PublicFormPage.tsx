import React, { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '../lib/api';
import type { PublicFormConfig, FormField, FormAppearance, ClassItem } from '../types';
import { DynamicFieldRenderer } from '../components/DynamicFieldRenderer';
import { SizeGuideModal } from '../components/SizeGuideModal';
import {
  ShieldCheck,
  Zap,
  Lock,
  Loader2,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';

const PENDING_CHECKOUT_KEY = 'ultra_pending_checkout_v1';

type PendingCheckout = {
  fingerprint: string;
  attemptId: string;
  registrationId?: string;
};

function readPendingCheckout(): PendingCheckout | undefined {
  try {
    const saved = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    return saved ? JSON.parse(saved) as PendingCheckout : undefined;
  } catch {
    return undefined;
  }
}

function writePendingCheckout(value: PendingCheckout): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(value));
  } catch {
    // Some browsers block storage. The in-memory reference still protects
    // retries made while this page remains mounted.
  }
}

function clearPendingCheckout(): void {
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // Storage may be unavailable in restrictive/private browsing contexts.
  }
}

function isFieldVisible(field: FormField, answers: Record<string, any>): boolean {
  if (!field.show_when) return true;
  const sourceValue = answers[field.show_when.field_id];
  if (sourceValue === undefined || sourceValue === null || sourceValue === '') return false;
  if (field.show_when.operator === 'equals') return String(sourceValue) === field.show_when.value;
  const actual = Number(sourceValue);
  const expected = Number(field.show_when.value);
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  return field.show_when.operator === 'greater_than_or_equal' ? actual >= expected : actual <= expected;
}

export const PublicFormPage: React.FC = () => {
  const pendingCheckoutRef = useRef<PendingCheckout | undefined>(undefined);
  const [config, setConfig] = useState<PublicFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form values
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState('');
  const [shirtSizeId, setShirtSizeId] = useState('');
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Size guide modal
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const birthYearFieldId = config?.form_fields.find((field) => field.key === 'birth_year')?.id;
  const birthYearValue = birthYearFieldId ? String(dynamicAnswers[birthYearFieldId] || '') : '';
  const genderFieldId = config?.form_fields.find((field) => field.key === 'selection_gender')?.id;
  const selectedGenderValue = genderFieldId ? String(dynamicAnswers[genderFieldId] || '') : '';

  useEffect(() => {
    if (!config || !classId || !birthYearValue || !selectedGenderValue) return;
    const selected = config.classes.find((item) => item.id === classId);
    const year = Number(birthYearValue);
    const matchesYear = !selected?.eligible_birth_years?.length || selected.eligible_birth_years.includes(year);
    const matchesGender = Boolean(selected?.gender.toUpperCase().includes(selectedGenderValue.toUpperCase()));
    if (!matchesYear || !matchesGender) {
      setClassId('');
    }
  }, [birthYearValue, selectedGenderValue, classId, config]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getPublicConfig();
      setConfig(data);
    } catch (err: any) {
      setErrorMessage('Não foi possível carregar o formulário no momento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (config?.form_fields) {
      for (const field of config.form_fields) {
        if (!isFieldVisible(field, dynamicAnswers)) continue;
        if (field.system_type === 'full_name' && field.required && fullName.trim().length < 3) {
          errors.full_name = 'Por favor, informe seu nome completo (mínimo 3 letras).';
          continue;
        }
        if (field.system_type === 'class_id' && field.required && !classId) {
          errors.class_id = `O campo "${field.label}" é obrigatório.`;
          continue;
        }
        if (field.system_type === 'shirt_size_id' && field.required && !shirtSizeId) {
          errors.shirt_size_id = `O campo "${field.label}" é obrigatório.`;
          continue;
        }
        if (field.system_type) continue;
        const rawValue = dynamicAnswers[field.id];
        if (field.key === 'rg' && rawValue) {
          const digits = String(rawValue).replace(/\D/g, '');
          if (digits.length < 7 || digits.length > 14) {
            errors[field.id] = 'Informe um RG válido com 7 a 14 números.';
            continue;
          }
        }
        if (field.key === 'birth_year' && rawValue) {
          const year = Number(rawValue);
          if (!Number.isInteger(year) || year < 2009 || year > 2018) {
            errors[field.id] = 'As seletivas são destinadas a atletas nascidos entre 2009 e 2018.';
            continue;
          }
        }
        if (field.required) {
          const val = rawValue;
          if (
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 0)
          ) {
            errors[field.id] = `O campo "${field.label}" é obrigatório.`;
          }
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);

      const submission = {
        full_name: fullName.trim(),
        class_id: classId,
        shirt_size_id: shirtSizeId,
        dynamic_answers: dynamicAnswers,
      };
      const fingerprint = JSON.stringify(submission);

      let pending = pendingCheckoutRef.current;
      if (!pending) {
        const saved = readPendingCheckout();
        if (saved?.fingerprint === fingerprint && saved.attemptId) pending = saved;
      }
      if (pending?.fingerprint !== fingerprint) pending = undefined;
      pending ||= { fingerprint, attemptId: crypto.randomUUID() };
      pendingCheckoutRef.current = pending;
      writePendingCheckout(pending);

      // Reuse the registration and attempt after an interrupted response. This
      // prevents duplicate registrations/checkouts when the user retries.
      if (!pending.registrationId) {
        const regResponse = await api.createRegistration({
          ...submission,
          attempt_id: pending.attemptId,
        });
        pending.registrationId = regResponse.registration.id;
        writePendingCheckout(pending);
        if (!regResponse.requires_payment) {
          pendingCheckoutRef.current = undefined;
          clearPendingCheckout();
          window.location.assign(`/inscricao/sucesso?code=${encodeURIComponent(regResponse.registration.public_code)}`);
          return;
        }
      }
      const registrationId = pending.registrationId;
      if (!registrationId) throw new Error('Não foi possível identificar a inscrição criada.');

      let orderResponse;
      try {
        orderResponse = await api.createOrder(registrationId, pending.attemptId);
      } catch (error) {
        // A known failed attempt cannot be reused because its webhook token is
        // intentionally not stored in plaintext. Retry the same registration
        // with one fresh idempotency key.
        if (error instanceof ApiError && error.code === 'checkout_attempt_failed') {
          pending.attemptId = crypto.randomUUID();
          writePendingCheckout(pending);
          orderResponse = await api.createOrder(registrationId, pending.attemptId);
        } else {
          throw error;
        }
      }

      // 4. Redirect directly to InfinitePay checkout in the same tab
      if (orderResponse.checkout_url) {
        pendingCheckoutRef.current = undefined;
        clearPendingCheckout();
        window.location.assign(orderResponse.checkout_url);
      } else {
        throw new Error('URL de checkout não disponível');
      }
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setErrorMessage(err.message || 'Erro ao processar sua inscrição. Verifique os dados e tente novamente.');
      setSubmitting(false);
    }
  };

  const formattedPrice = config
    ? `R$ ${(config.shirt_price / 100).toFixed(2).replace('.', ',')}`
    : 'R$ 70,00';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-900 flex items-center justify-center shadow-xl animate-pulse mb-4">
          <span className="text-3xl">🏐</span>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Carregando formulário Ultra Volleyball...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Formulário temporariamente indisponível</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">{errorMessage || 'Não foi possível carregar as informações do servidor.'}</p>
        <button
          onClick={loadConfig}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const selectedSize = config.shirt_sizes.find((s) => s.id === shirtSizeId);
  const selectedClass = config.classes.find((c) => c.id === classId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-slate-900 font-sans pb-16">
      {/* Sporty Top Banner */}
      <header className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden border-b border-blue-700/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 flex flex-col items-center text-center">
          {config.appearance.header_banner_url && (
            <div className="w-full h-52 sm:h-64 rounded-3xl overflow-hidden border border-white/20 shadow-2xl mb-6 bg-blue-950">
              <img
                src={config.appearance.header_banner_url}
                alt="Ultra Volleyball e Batalha - Seletivas 2027"
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}
          {(config.appearance.primary_logo_url || config.appearance.secondary_logo_url) && (
            <div className="flex items-center justify-center gap-5 mb-5">
              {config.appearance.primary_logo_url && <img src={config.appearance.primary_logo_url} alt="Logo principal" className="max-h-16 max-w-[180px] object-contain" />}
              {config.appearance.secondary_logo_url && <img src={config.appearance.secondary_logo_url} alt="Logo secundário" className="max-h-14 max-w-[150px] object-contain" />}
            </div>
          )}
          {config.appearance.eyebrow && <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-4 shadow-sm"><span className="w-2 h-2 rounded-full bg-amber-400"></span>{config.appearance.eyebrow}</div>}

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none text-white drop-shadow-sm">
            {config.appearance.title}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mt-2.5 max-w-md font-medium">
            {config.appearance.description}
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 -mt-4 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Atenção</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Form Questions loaded from DB in sort_order */}
            {config.form_fields.map((field) => {
              if (!isFieldVisible(field, dynamicAnswers)) return null;
              if (field.system_type === 'full_name') {
                return (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={fullName}
                    onChange={setFullName}
                    error={fieldErrors.full_name}
                  />
                );
              }

              if (field.system_type === 'class_id') {
                return (
                  <React.Fragment key={field.id}>
                    <DynamicFieldRenderer
                      field={field}
                      value={classId}
                      onChange={setClassId}
                      classes={config.classes}
                      birthYear={birthYearValue}
                      selectedGender={selectedGenderValue}
                      error={fieldErrors.class_id}
                    />
                    {selectedClass && <LocationPreview selectedClass={selectedClass} appearance={config.appearance} />}
                  </React.Fragment>
                );
              }

              if (field.system_type === 'shirt_size_id') {
                return (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={shirtSizeId}
                    onChange={setShirtSizeId}
                    shirtSizes={config.shirt_sizes}
                    onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                    error={fieldErrors.shirt_size_id}
                  />
                );
              }

              // Custom field
              return (
                <DynamicFieldRenderer
                  key={field.id}
                  field={field}
                  value={dynamicAnswers[field.id]}
                  onChange={(val) => {
                    setDynamicAnswers((prev) => ({
                      ...prev,
                      [field.id]: val,
                    }));
                  }}
                  error={fieldErrors[field.id]}
                />
              );
            })}

            {config.appearance.payment_enabled && <div className="pt-4 border-t border-slate-200">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Resumo do Pedido</span>
                  <span className="text-blue-700 font-extrabold">Ultra Volleyball</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-200 text-sm">
                  <div>
                    <p className="font-bold text-slate-900">Camiseta Ultra Volleyball</p>
                    <p className="text-xs text-slate-500">
                      {selectedSize ? `Tamanho: ${selectedSize.code} (${selectedSize.category === 'adult' ? 'Adulto' : 'Infantil'})` : 'Tamanho a definir'}
                      {selectedClass ? ` • ${selectedClass.unit}` : ''}
                    </p>
                  </div>
                  {/* Strict rule: quantity is fixed to 1, no +/- buttons */}
                  <div className="text-right">
                    <span className="inline-block bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-md font-bold">
                      Qtd: 1
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-500 block">Total a pagar</span>
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pagamento seguro InfinitePay
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-900 tracking-tight">
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>}

            {/* CTA Button */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 px-6 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  submitting
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-900/30 active:scale-[0.99]'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando cadastro...</span>
                  </>
                ) : (
                  <>
                    <span>{config.appearance.payment_enabled ? `Pagar ${formattedPrice}` : config.appearance.submit_label}</span>
                    <ChevronRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Dados enviados com segurança
                </span>
                {config.appearance.payment_enabled && <><span>•</span><span>PIX & Cartão</span></>}
              </div>
            </div>
          </form>
        </div>

        {/* Footer info & Admin link */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-2">
          <p>© 2026 Ultra Volleyball. Todos os direitos reservados.</p>
          <div>
            <a
              href="/admin"
              className="text-slate-400 hover:text-amber-400 underline transition-colors"
            >
              Área Administrativa
            </a>
          </div>
        </div>
      </main>

      {/* Modal Tabela de Medidas */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        sizes={config.shirt_sizes}
        selectedSizeId={shirtSizeId}
        onSelectSize={(id) => setShirtSizeId(id)}
      />
    </div>
  );
};

const LocationPreview: React.FC<{ selectedClass: ClassItem; appearance: FormAppearance }> = ({
  selectedClass,
  appearance,
}) => {
  const isBsc = selectedClass.unit.toUpperCase().includes('BSC');
  const address = isBsc ? appearance.location_bsc_address : appearance.location_colegio_address;
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
  const embedUrl = isBsc ? appearance.maps_bsc_embed_url : appearance.maps_colegio_embed_url;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-blue-950">Local: {selectedClass.unit}</p>
          {address ? (
            <>
              <p className="text-xs text-blue-800 mt-0.5">{address}</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-700 underline">
                Ver rota no Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          ) : appearance.maps_enabled && embedUrl ? (
            <p className="text-xs text-blue-700 mt-0.5">
              Consulte o mapa abaixo para visualizar o local da peneira.
            </p>
          ) : (
            <p className="text-xs text-blue-700 mt-0.5">
              O endereço será exibido assim que for configurado.
            </p>
          )}
        </div>
      </div>
      {appearance.maps_enabled && embedUrl && (
        <iframe
          title={`Mapa do local ${selectedClass.unit}`}
          src={embedUrl}
          className="w-full h-64 border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </div>
  );
};
