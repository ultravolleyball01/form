import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  QrCode,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const SandboxCheckoutPage: React.FC = () => {
  const [orderNsu, setOrderNsu] = useState('');
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<'pix' | 'card'>('pix');
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nsu = params.get('order_nsu') || '';
    const tok = params.get('token') || '';
    setOrderNsu(nsu);
    setToken(tok);

    if (nsu) {
      loadStatus(nsu);
    } else {
      setError('Identificador de ordem não encontrado na URL.');
      setLoading(false);
    }
  }, []);

  const loadStatus = async (nsu: string) => {
    try {
      setLoading(true);
      const data = await api.getOrderStatus(nsu);
      setStatusData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da ordem');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (method: 'pix' | 'credit_card') => {
    if (!orderNsu) return;
    try {
      setProcessingPayment(true);
      setError('');

      await api.simulateSandboxPayment(orderNsu, token, method);

      // Redirect to processing check screen (Rule 49: redirect does not self-confirm, server validates)
      window.location.href = `/pagamento/processando?order_nsu=${orderNsu}`;
    } catch (err: any) {
      setError(err.message || 'Erro ao processar simulação de pagamento');
      setProcessingPayment(false);
    }
  };

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${orderNsu}5204000053039865405${
    statusData ? (statusData.amount / 100).toFixed(2) : '60.00'
  }5802BR5925ULTRA VOLLEYBALL CLUBE6009SAO PAULO62070503***6304`;

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
        <p className="text-slate-300 font-medium text-sm">Carregando ambiente seguro de pagamento...</p>
      </div>
    );
  }

  const formattedAmount = statusData
    ? `R$ ${(statusData.amount / 100).toFixed(2).replace('.', ',')}`
    : 'R$ 60,00';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-slate-100 font-sans py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* InfinitePay Sport Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              ∞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">InfinitePay</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CHECKOUT SEGURO
                </span>
              </div>
              <p className="text-xs text-slate-400">Ultra Volleyball • Pagamento de Camiseta</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total</span>
            <span className="text-2xl font-black text-amber-400">{formattedAmount}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Details Preview */}
        {statusData && (
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Inscrito:</span>
              <strong className="text-white">{statusData.participant_name}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Turma:</span>
              <span className="text-slate-200 truncate max-w-[260px] text-right">{statusData.class_label}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Camiseta:</span>
              <span className="text-amber-300 font-bold">
                Tamanho {statusData.shirt_size_code} ({statusData.shirt_category === 'adult' ? 'Adulto' : 'Infantil'})
              </span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700">
              <span>Código:</span>
              <code className="bg-slate-900 px-2 py-0.5 rounded font-mono text-amber-400">{statusData.public_code}</code>
            </div>
          </div>
        )}

        {/* Payment Methods Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 text-slate-900">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setTab('pix')}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab === 'pix' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" /> PIX (Aprovação Imediata)
            </button>
            <button
              type="button"
              onClick={() => setTab('card')}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab === 'card' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Cartão de Crédito
            </button>
          </div>

          {/* PIX TAB */}
          {tab === 'pix' && (
            <div className="space-y-5 text-center">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {/* Visual QR Code Generator */}
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="2" />
                    <rect x="14" y="14" width="16" height="16" fill="white" rx="1" />
                    <rect x="18" y="18" width="8" height="8" fill="#059669" />
                    
                    <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="2" />
                    <rect x="70" y="14" width="16" height="16" fill="white" rx="1" />
                    <rect x="74" y="18" width="8" height="8" fill="#059669" />

                    <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="2" />
                    <rect x="14" y="70" width="16" height="16" fill="white" rx="1" />
                    <rect x="18" y="74" width="8" height="8" fill="#059669" />

                    {/* QR Code matrix pattern */}
                    <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
                    <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                    <rect x="46" y="24" width="6" height="6" fill="#0f172a" />
                    <rect x="40" y="34" width="18" height="6" fill="#0f172a" />
                    <rect x="12" y="44" width="6" height="14" fill="#0f172a" />
                    <rect x="24" y="44" width="8" height="8" fill="#0f172a" />
                    <rect x="40" y="46" width="20" height="8" fill="#059669" />
                    <rect x="68" y="44" width="6" height="6" fill="#0f172a" />
                    <rect x="80" y="44" width="8" height="12" fill="#0f172a" />
                    <rect x="42" y="62" width="10" height="10" fill="#0f172a" />
                    <rect x="60" y="62" width="6" height="14" fill="#0f172a" />
                    <rect x="74" y="66" width="14" height="6" fill="#0f172a" />
                    <rect x="50" y="80" width="12" height="8" fill="#0f172a" />
                    <rect x="70" y="80" width="18" height="8" fill="#0f172a" />
                  </svg>
                </div>

                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Abra o aplicativo do seu banco e aponte a câmera para o QR Code
                </p>
              </div>

              {/* Pix Copia e Cola */}
              <div className="text-left space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 rounded-xl border border-slate-200 text-slate-600 truncate"
                  />
                  <button
                    type="button"
                    onClick={copyPix}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Simulation Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => handleSimulatePayment('pix')}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando no gateway...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Simular Pagamento PIX Aprovado</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">
                  Simulação de ambiente de pagamento integrado InfinitePay.
                </p>
              </div>
            </div>
          )}

          {/* CARD TAB */}
          {tab === 'card' && (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número do Cartão</label>
                <input
                  type="text"
                  defaultValue="4000 1234 5678 9010"
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Validade</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CVV</label>
                  <input
                    type="text"
                    defaultValue="888"
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parcelamento</label>
                <select
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm"
                >
                  <option>1x de {formattedAmount} (Sem juros)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => handleSimulatePayment('credit_card')}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando no gateway...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pagar {formattedAmount} (Cartão Aprovado)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Criptografia de Ponta a Ponta
          </span>
          <span>•</span>
          <span>InfinitePay Certified Gateway</span>
        </div>
      </div>
    </div>
  );
};
