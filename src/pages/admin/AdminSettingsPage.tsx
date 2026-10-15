import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  DollarSign,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [currentPriceCents, setCurrentPriceCents] = useState(7000);
  const [priceInput, setPriceInput] = useState('70,00');
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState('');
  const [priceError, setPriceError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // InfinitePay settings
  const [infinitePayHandle, setInfinitePayHandle] = useState('');
  const [infinitePayMode, setInfinitePayMode] = useState<'production' | 'sandbox'>('production');
  const [savingInfinitePay, setSavingInfinitePay] = useState(false);
  const [infinitePaySuccess, setInfinitePaySuccess] = useState('');
  const [infinitePayError, setInfinitePayError] = useState('');
  const [infinitePayManagedByEnvironment, setInfinitePayManagedByEnvironment] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingPrice(true);
      const res = await api.getAdminSettings();
      setCurrentPriceCents(res.shirt_price);
      setPriceInput((res.shirt_price / 100).toFixed(2).replace('.', ','));
      if (res.infinitepay_handle) {
        setInfinitePayHandle(res.infinitepay_handle);
      }
      if (res.infinitepay_mode) {
        setInfinitePayMode(res.infinitepay_mode);
      }
      setInfinitePayManagedByEnvironment(res.infinitepay_managed_by_environment === true);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceSuccess('');
    setPriceError('');

    // Parse R$ input to cents
    const cleanStr = priceInput.replace('R$', '').trim().replace('.', '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);

    if (!Number.isFinite(floatVal) || floatVal <= 0) {
      setPriceError('Por favor, informe um valor monetário positivo válido.');
      return;
    }

    const cents = Math.round(floatVal * 100);

    try {
      setSavingPrice(true);
      const res = await api.updateShirtPrice(cents);
      setCurrentPriceCents(res.shirt_price);
      setPriceSuccess(`Valor atualizado com sucesso para ${res.formatted}!`);
      setTimeout(() => setPriceSuccess(''), 4000);
    } catch (err: any) {
      setPriceError(err.message || 'Erro ao atualizar preço da camiseta');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 12) {
      setPasswordError('A nova senha deve possuir no mínimo 12 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    try {
      setSavingPassword(true);
      await api.updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Senha de administrador alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Parâmetros globais, valor oficial da camiseta e segurança administrativa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION: Valor da Camiseta (Rule 3 & 4) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Valor da Camiseta
              </h3>
              <p className="text-xs text-slate-400">Preço unitário oficial por inscrição</p>
            </div>
          </div>

          {/* Current display badge */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-900 font-bold uppercase tracking-wider block">
                Valor Atual Ativo:
              </span>
              <span className="text-xs text-blue-700">
                Armazenado no banco: {currentPriceCents} centavos
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-950 font-mono tracking-tight">
                R$ {(currentPriceCents / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {priceSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{priceSuccess}</span>
            </div>
          )}

          {priceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{priceError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePrice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Novo Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">R$</span>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="70,00"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Crucial historical preservation notice (Rule 4) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Regra de integridade histórica:</p>
              <p className="text-[11px] text-slate-500">
                A alteração afeta <strong>somente novas inscrições</strong>. Todas as inscrições anteriores preservam seu valor original gravado no momento da compra (snapshot). Não exige novo deploy.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingPrice || loadingPrice}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingPrice ? 'Atualizando...' : 'Salvar Novo Valor'}</span>
            </button>
          </form>
        </div>

        {/* SECTION: Alteração de Senha */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Segurança do Administrador
              </h3>
              <p className="text-xs text-slate-400">Altere a senha de acesso ao painel</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Senha Atual *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nova Senha (mínimo 12 caracteres) *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{savingPassword ? 'Alterando...' : 'Atualizar Senha'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Integration InfinitePay Configuration Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Integração Oficial InfinitePay
              </h3>
              <p className="text-xs text-slate-400">Configuração de checkout, handle e webhook</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            infinitePayMode === 'production'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {infinitePayMode === 'production' ? '● Ambiente: Produção Ativo' : '● Ambiente: Sandbox / Testes'}
          </span>
        </div>

        {infinitePaySuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infinitePaySuccess}</span>
          </div>
        )}

        {infinitePayError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{infinitePayError}</span>
          </div>
        )}

        {infinitePayManagedByEnvironment && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
            Em produção, a InfiniteTag e o modo são controlados pelas variáveis da Netlify. Altere <strong>INFINITEPAY_HANDLE</strong> no painel da hospedagem e publique novamente.
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setInfinitePaySuccess('');
            setInfinitePayError('');
            try {
              setSavingInfinitePay(true);
              const res = await api.updateInfinitePaySettings(infinitePayHandle, infinitePayMode);
              setInfinitePayHandle(res.infinitepay_handle);
              setInfinitePayMode(res.infinitepay_mode);
              setInfinitePaySuccess('Configurações da InfinitePay salvas com sucesso!');
              setTimeout(() => setInfinitePaySuccess(''), 4000);
            } catch (err: any) {
              setInfinitePayError(err.message || 'Erro ao salvar configurações');
            } finally {
              setSavingInfinitePay(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Handle Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                InfiniteTag / Handle da Conta *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">$</span>
                <input
                  type="text"
                  value={infinitePayHandle}
                  onChange={(e) => setInfinitePayHandle(e.target.value.replace('$', '').trim())}
                  disabled={infinitePayManagedByEnvironment}
                  placeholder="sua-infinite-tag"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Informe a InfiniteTag cadastrada no Checkout Integrado, sem o caractere $.
              </p>
            </div>

            {/* Mode selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Modo de Operação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInfinitePayMode('production')}
                  disabled={infinitePayManagedByEnvironment}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    infinitePayMode === 'production'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Produção (Oficial)
                </button>
                <button
                  type="button"
                  onClick={() => setInfinitePayMode('sandbox')}
                  disabled={infinitePayManagedByEnvironment}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    infinitePayMode === 'sandbox'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Sandbox (Simulador)
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Em Produção, os clientes são redirecionados diretamente para o checkout da InfinitePay.
              </p>
            </div>
          </div>

          {/* Webhook notification URL */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Webhook do checkout integrado
            </span>
            <p className="text-xs text-slate-600">
              O sistema gera automaticamente uma URL autenticada exclusiva para cada pedido e a envia na criação do checkout. Não cadastre uma URL fixa manualmente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <a
              href="https://www.infinitepay.io/checkout"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
            >
              Abrir documentação do Checkout Integrado →
            </a>

            <button
              type="submit"
              disabled={savingInfinitePay || infinitePayManagedByEnvironment}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingInfinitePay ? 'Salvando...' : 'Salvar Configuração InfinitePay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
