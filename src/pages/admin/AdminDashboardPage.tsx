import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  Shirt,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedRevenue = data
    ? `R$ ${(data.total_revenue_cents / 100).toFixed(2).replace('.', ',')}`
    : 'R$ 0,00';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Painel Geral
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Acompanhamento em tempo real de inscrições, camisetas e faturamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <a
            href="/admin/inscricoes"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors"
          >
            Ver Inscrições
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 6 Mandatory Dashboard KPIs (Rule 52) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Inscrições confirmadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              Inscrições Confirmadas
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.total_confirmed ?? 0}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Pagamentos validados com sucesso
          </p>
        </div>

        {/* 2. Aguardando pagamento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
              Aguardando Pagamento
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.waiting_payment ?? 0}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-1">
            Pedidos pendentes no gateway
          </p>
        </div>

        {/* 3. Inscrições hoje */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              Inscrições Hoje
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.registrations_today ?? 0}
          </p>
          <p className="text-xs text-blue-600 font-medium mt-1">
            Inscritos no dia de hoje
          </p>
        </div>

        {/* 4. Total recebido */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
              Total Recebido
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-800 tracking-tight">
            {formattedRevenue}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Faturamento líquido confirmado
          </p>
        </div>

        {/* 5. Camisetas confirmadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">
              Camisetas Confirmadas
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.total_confirmed_shirts ?? 0}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Unidades a produzir para alunos
          </p>
        </div>

        {/* 6. Pagamentos com problema */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-red-700 uppercase tracking-wider">
              Pagamentos com Problema
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.payment_issues ?? 0}
          </p>
          <p className="text-xs text-red-600 font-medium mt-1">
            Transações recusadas ou falhas
          </p>
        </div>
      </div>

      {/* Quick shortcuts & Recent registrations table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
              Últimas Inscrições
            </h3>
            <p className="text-xs text-slate-500">Últimos pedidos registrados no sistema</p>
          </div>
          <a
            href="/admin/inscricoes"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Ver todas →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4">Turma</th>
                <th className="py-3 px-4">Tamanho</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data?.recent_registrations?.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma inscrição registrada ainda.
                  </td>
                </tr>
              ) : (
                data.recent_registrations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {r.public_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.participant_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {r.class_label_snapshot}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{r.shirt_size_code_snapshot}</span>{' '}
                      <span className="text-[10px] text-slate-400">
                        ({r.shirt_category_snapshot === 'adult' ? 'Adulto' : 'Infantil'})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      R$ {(r.amount / 100).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Confirmada
                        </span>
                      ) : r.status === 'pending_payment' || r.status === 'processing_payment' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Aguardando
                        </span>
                      ) : r.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                          Cancelada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                          Falhou
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={`/admin/inscricoes/${r.id}`}
                        className="text-blue-600 hover:text-blue-900 font-bold underline"
                      >
                        Detalhes
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
