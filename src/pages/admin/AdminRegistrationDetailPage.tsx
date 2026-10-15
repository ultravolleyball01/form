import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { RegistrationWithDetails } from '../../types';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shirt,
  CreditCard,
  User,
  ClipboardList,
  AlertCircle,
  Ban,
  Hash,
} from 'lucide-react';

export const AdminRegistrationDetailPage: React.FC<{ registrationId: string }> = ({
  registrationId,
}) => {
  const [data, setData] = useState<RegistrationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetails();
  }, [registrationId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminRegistrationDetail(registrationId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Carregando detalhes da inscrição...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Inscrição não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <a
          href="/admin/inscricoes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para lista
        </a>
      </div>
    );
  }

  const isConfirmed = data.status === 'confirmed';
  const isCancelled = data.status === 'cancelled';
  const canManagePayment = !isConfirmed && !isCancelled && data.payment?.status !== 'paid';

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <a
          href="/admin/inscricoes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Inscrições</span>
        </a>

        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmada
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700">
              <Ban className="w-3.5 h-3.5" /> Cancelada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento
            </span>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {data.public_code}
            </span>
            <span className="text-xs text-slate-400">
              Registrado em {new Date(data.created_at).toLocaleString('pt-BR')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            {data.participant_name}
          </h1>
          <p className="text-xs font-semibold text-blue-700 mt-0.5">
            {data.class_label_snapshot}
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
          <span className="text-xs text-slate-400 block font-medium">Valor da Inscrição</span>
          <span className="text-2xl font-black text-slate-900">
            R$ {(data.amount / 100).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Qtd: 1 camiseta</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: Perguntas e Respostas Dinâmicas (Rule 56 & 57) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
              Perguntas e Respostas (Snapshots)
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Respostas salvas exatamente no momento em que o participante preencheu o formulário:
          </p>

          <div className="space-y-3 pt-1">
            {data.answers?.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma resposta registrada.</p>
            ) : (
              data.answers.map((ans) => (
                <div
                  key={ans.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase block">
                    {ans.label_snapshot}
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    {ans.value || <span className="text-slate-400 italic">Não respondido</span>}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: Camiseta e Medidas (Rule 56) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shirt className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Dados da Camiseta
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">Tamanho Escolhido</span>
                <span className="text-lg font-black text-blue-900 block mt-0.5">
                  {data.shirt_size_code_snapshot}
                </span>
                <span className="text-[11px] text-slate-500">
                  {data.shirt_category_snapshot === 'adult' ? 'Categoria Adulto' : 'Categoria Infantil'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">Dimensões da Peça</span>
                <span className="text-sm font-black text-slate-800 block mt-1 font-mono">
                  {data.shirt_width_cm_snapshot} × {data.shirt_length_cm_snapshot} cm
                </span>
                <span className="text-[11px] text-slate-400">Largura × Comprimento</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <span className="text-slate-400 block">Quantidade</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">
                  1 unidade oficial (Regra estrutural do produto)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Pagamento InfinitePay (Rule 56) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                Informações de Pagamento
              </h3>
            </div>

            {data.payment ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gateway:</span>
                  <span className="font-bold text-slate-800">InfinitePay</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Situação:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {data.payment.status === 'paid' ? 'Pago / Confirmado' : data.payment.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Order NSU:</span>
                  <code className="font-mono text-slate-600">{data.payment.order_nsu}</code>
                </div>
                {data.payment.transaction_nsu && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Transaction NSU:</span>
                    <code className="font-mono text-blue-700 font-bold">{data.payment.transaction_nsu}</code>
                  </div>
                )}
                {data.payment.capture_method && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Forma de Captura:</span>
                    <span className="font-bold text-slate-800 uppercase">{data.payment.capture_method}</span>
                  </div>
                )}
                {data.payment.paid_at && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Confirmado em:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(data.payment.paid_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
                {data.payment.receipt_url && (
                  <div className="pt-2">
                    <a
                      href={data.payment.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Comprovante InfinitePay
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Nenhum registro de checkout iniciado para esta inscrição.</p>
            )}

            {canManagePayment && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const confirmAction = window.confirm(
                      'Deseja confirmar manualmente o pagamento desta inscrição? Use isso caso tenha recebido o valor via InfinitePay PIX ou maquininha.'
                    );
                    if (confirmAction) {
                      try {
                        const nsu = prompt('Digite o NSU ou código da transação (opcional):') || `MANUAL-${Date.now()}`;
                        await api.confirmRegistrationPaymentManually(data.id, nsu);
                        alert('Inscrição confirmada com sucesso!');
                        loadDetails();
                      } catch (err: any) {
                        alert(err.message || 'Erro ao confirmar');
                      }
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Pagamento Manualmente (InfinitePay)</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const cancelAction = window.confirm(
                      'Deseja cancelar esta pendência de pagamento? O histórico será preservado. Esta ação não estorna pagamentos e não invalida um link que já tenha sido aberto na InfinitePay.'
                    );
                    if (cancelAction) {
                      try {
                        await api.cancelRegistrationPayment(data.id);
                        alert('Pendência de pagamento cancelada com sucesso!');
                        loadDetails();
                      } catch (err: any) {
                        alert(err.message || 'Erro ao cancelar a pendência');
                      }
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancelar Pendência</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
