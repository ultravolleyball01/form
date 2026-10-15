import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Shirt,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

export const SuccessPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Launch celebratory confetti explosion!
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#004de6', '#facc15', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      // ignore
    }

    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get('order_nsu') || '';
    const code = params.get('code') || '';

    if (orderNsu || code) {
      loadDetails(orderNsu, code);
    } else {
      setLoading(false);
    }
  }, []);

  const loadDetails = async (nsu: string, code: string) => {
    try {
      setLoading(true);
      const res = await api.getOrderStatus(nsu, code);
      setData(res);
    } catch (err) {
      console.error('Error fetching success details:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.public_code) {
      navigator.clipboard.writeText(data.public_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-slate-900 font-sans py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Main Success Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 overflow-hidden relative">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-blue-600 to-amber-400"></div>

          {/* Success Header Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
              Inscrição confirmada!
            </h1>

            {/* Badges strictly required by Rule 50 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Pagamento confirmado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Camiseta solicitada com sucesso
              </span>
            </div>
          </div>

          {/* Code Highlight Box */}
          {data?.public_code && (
            <div className="bg-gradient-to-br from-blue-50 to-amber-50/50 rounded-2xl p-4 border border-blue-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
                  Código da Inscrição
                </span>
                <span className="text-2xl font-black text-blue-950 font-mono tracking-wider">
                  {data.public_code}
                </span>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>
          )}

          {/* Detailed Receipt Card (Rule 50) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-sm">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
              Detalhes da Inscrição e Pedido
            </h3>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Participante:
              </span>
              <strong className="text-slate-900 text-right">{data?.participant_name || 'Participante'}</strong>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs">Unidade / Turma:</span>
              <span className="text-slate-800 font-semibold text-right max-w-[260px]">
                {data?.class_label || 'Turma Selecionada'}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-slate-400" /> Camiseta:
              </span>
              <span className="text-right">
                <span className="font-extrabold text-blue-900">
                  Tamanho {data?.shirt_size_code || 'M'}
                </span>{' '}
                <span className="text-xs text-slate-500">
                  ({data?.shirt_category === 'adult' ? 'Adulto' : 'Infantil'})
                </span>
              </span>
            </div>

            {data?.width_cm && data?.length_cm && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 text-xs">Medidas da Peça:</span>
                <span className="text-slate-700 text-xs font-mono">
                  {data.width_cm} cm (largura) × {data.length_cm} cm (comprimento)
                </span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <span className="text-slate-500 text-xs">Quantidade:</span>
              <span className="font-bold text-slate-900">1 camiseta oficial</span>
            </div>

            <div className="flex items-start justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Valor Pago:
              </span>
              <strong className="text-emerald-700 font-black text-base">
                {data?.amount ? `R$ ${(data.amount / 100).toFixed(2).replace('.', ',')}` : 'R$ 70,00'}
              </strong>
            </div>

            {data?.paid_at && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data e Hora:
                </span>
                <span className="text-slate-700 text-xs font-medium">
                  {new Date(data.paid_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}

            {data?.transaction_nsu && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 text-xs">NSU InfinitePay:</span>
                <code className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {data.transaction_nsu}
                </code>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {data?.receipt_url && (
              <a
                href={data.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Ver Comprovante
              </a>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir Comprovante
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <span>Fazer outra inscrição</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center text-xs text-slate-400">
          <p>Dúvidas sobre a entrega ou confecção das camisetas? Fale com a coordenação da sua unidade Ultra Volleyball.</p>
        </div>
      </div>
    </div>
  );
};
