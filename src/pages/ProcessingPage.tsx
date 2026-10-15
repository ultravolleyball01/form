import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const ProcessingPage: React.FC = () => {
  const [orderNsu, setOrderNsu] = useState('');
  const [statusText, setStatusText] = useState('Verificando status junto ao banco e operadora...');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nsu = params.get('order_nsu') || '';
    setOrderNsu(nsu);

    if (!nsu) {
      setError('Identificador da transação não encontrado.');
      return;
    }

    const transactionNsu = params.get('transaction_nsu') || params.get('nsu') || params.get('transaction_id') || '';
    const invoiceSlug = params.get('slug') || params.get('invoice_slug') || '';

    let isMounted = true;
    const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const redirectToSuccess = () => {
      if (!isMounted) return;
      setStatusText('Pagamento confirmado com sucesso! Redirecionando...');
      setTimeout(() => {
        if (isMounted) window.location.href = `/inscricao/sucesso?order_nsu=${nsu}`;
      }, 800);
    };

    const verifyWithLimitedPolling = async () => {
      const delays = [0, 1_500, 3_000];
      for (let index = 0; index < delays.length && isMounted; index += 1) {
        if (delays[index]) await wait(delays[index]);
        if (!isMounted) return;
        setAttempts(index + 1);
        try {
          const statusRes = await api.getOrderStatus(nsu);
          if (statusRes.paid || statusRes.status === 'confirmed') {
            redirectToSuccess();
            return;
          }
          if (statusRes.status === 'payment_failed') {
            setError('Não foi possível iniciar ou confirmar esse pagamento. Volte e tente novamente.');
            return;
          }
        } catch (err) {
          console.warn('Order status check failed', err);
        }
      }

      // Give the webhook the fast path before starting the slower provider
      // request. This reduces contention with the single-row Netlify state
      // lock. The redirect itself never proves that a payment succeeded.
      if (transactionNsu && invoiceSlug) {
        try {
          const checkRes = await api.checkPayment(nsu, transactionNsu, invoiceSlug);
          if (checkRes.paid || checkRes.status === 'confirmed') {
            redirectToSuccess();
            return;
          }
        } catch (err) {
          console.warn('InfinitePay confirmation is temporarily unavailable', err);
        }
      }

      if (isMounted) {
        setStatusText('A confirmação ainda não chegou. Aguarde alguns instantes e use "Verificar agora".');
      }
    };

    void verifyWithLimitedPolling();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualCheck = async () => {
    if (!orderNsu) return;
    try {
      setError('');
      setStatusText('Consultando operadora agora...');
      const params = new URLSearchParams(window.location.search);
      const transactionNsu = params.get('transaction_nsu') || params.get('nsu') || '';
      const invoiceSlug = params.get('slug') || params.get('invoice_slug') || '';
      if (transactionNsu && invoiceSlug) {
        const checkRes = await api.checkPayment(orderNsu, transactionNsu, invoiceSlug);
        if (checkRes.paid || checkRes.status === 'confirmed') {
          window.location.href = `/inscricao/sucesso?order_nsu=${orderNsu}`;
          return;
        }
      }
      const statusRes = await api.getOrderStatus(orderNsu);
      if (statusRes.paid || statusRes.status === 'confirmed') {
        window.location.href = `/inscricao/sucesso?order_nsu=${orderNsu}`;
        return;
      }
      setStatusText('Aguardando confirmação da operadora. Se você concluiu o pagamento na InfinitePay, a confirmação acontecerá em instantes.');
    } catch (err: any) {
      setError('Erro ao verificar pagamento. Aguarde a confirmação automática.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl backdrop-blur-md">
        {/* Animated Volleyball Element */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-600/30 animate-ping"></div>
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-amber-400 p-1 flex items-center justify-center shadow-xl">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <span className="text-4xl animate-bounce">🏐</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
          Confirmando seu pagamento...
        </h1>
        <p className="text-sm text-slate-300 font-medium mb-6">
          {statusText}
        </p>

        {error ? (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificação em tempo real (Tentativa {attempts})</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleManualCheck}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Verificar Agora
          </button>

          <a
            href="/"
            className="block text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
};
