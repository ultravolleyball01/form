import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Shirt, Printer, RefreshCw, Filter, CheckCircle2 } from 'lucide-react';

export const AdminShirtsReportPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allStatus, setAllStatus] = useState(false); // default: confirmed only (Rule 58)

  useEffect(() => {
    loadReport();
  }, [allStatus]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminShirtsReport(allStatus);
      setData(res);
    } catch (err) {
      console.error('Error loading shirts report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Relatório de Camisetas para Produção
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Grade de fabricação consolidada por tamanho, categoria, unidade e turma
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter confirmed only vs all */}
          <button
            type="button"
            onClick={() => setAllStatus(!allStatus)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              !allStatus
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            {!allStatus ? 'Apenas Pagas/Confirmadas' : 'Todas (Incluindo Pendentes)'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Grade</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Total de Camisetas</span>
          <p className="text-3xl font-black text-blue-900 mt-1">{data?.total_shirts ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">1 unidade por inscrição</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Tamanhos Adulto</span>
          <p className="text-3xl font-black text-slate-800 mt-1">{data?.total_adult ?? 0}</p>
          <p className="text-xs text-blue-600 font-semibold mt-0.5">
            {data?.total_shirts ? ((data.total_adult / data.total_shirts) * 100).toFixed(0) : 0}% da produção
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Tamanhos Infantil</span>
          <p className="text-3xl font-black text-amber-900 mt-1">{data?.total_child ?? 0}</p>
          <p className="text-xs text-amber-600 font-semibold mt-0.5">
            {data?.total_shirts ? ((data.total_child / data.total_shirts) * 100).toFixed(0) : 0}% da produção
          </p>
        </div>
      </div>

      {/* Grid of sizes (Rule 59) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Shirt className="w-4 h-4 text-blue-600" />
            Resumo Oficial por Tamanho (Grade de Corte)
          </h3>
          <span className="text-xs text-slate-500 font-medium">Largura × Comprimento</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {data?.by_size?.map((item: any) => {
            const isChild = item.category === 'child';
            return (
              <div
                key={item.code}
                className={`p-4 rounded-xl border flex flex-col items-center justify-between transition-all ${
                  item.count > 0
                    ? isChild
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="text-center">
                  <span className="text-lg font-black tracking-tight text-slate-900 block">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {isChild ? 'Infantil' : 'Adulto'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    {item.width_cm} × {item.length_cm} cm
                  </span>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-base font-black ${
                      item.count > 0
                        ? isChild
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdowns by Unit & Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Distribuição por Unidade
          </h3>
          <div className="space-y-2">
            {!data?.by_unit?.length ? (
              <p className="text-xs text-slate-400">Nenhum pedido registrado.</p>
            ) : (
              data.by_unit.map((u: any) => (
                <div
                  key={u.unit}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-slate-800">UNIDADE {u.unit}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-black">
                    {u.count} un
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Class Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Distribuição por Turma / Horário
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {!data?.by_class?.length ? (
              <p className="text-xs text-slate-400">Nenhum pedido registrado.</p>
            ) : (
              data.by_class.map((c: any) => (
                <div
                  key={c.label}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[280px]" title={c.label}>
                    {c.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-black shrink-0">
                    {c.count} un
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
