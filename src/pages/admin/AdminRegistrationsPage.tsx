import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import type { ClassItem, ShirtSize } from '../../types';

export const AdminRegistrationsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [unit, setUnit] = useState('');
  const [classId, setClassId] = useState('');
  const [category, setCategory] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Classes and sizes for filter dropdowns
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [shirtSizes, setShirtSizes] = useState<ShirtSize[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    loadFiltersData();
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [page, status, classId, unit, category, sizeId, startDate, endDate]);

  const loadFiltersData = async () => {
    try {
      const [cls, sizes] = await Promise.all([
        api.getAdminClasses(),
        api.getAdminShirtSizes(),
      ]);
      setClasses(cls);
      setShirtSizes(sizes);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const query: Record<string, string> = {
        page: String(page),
        limit: '25',
      };
      if (search.trim()) query.search = search.trim();
      if (status) query.status = status;
      if (unit) query.unit = unit;
      if (classId) query.class_id = classId;
      if (category) query.category = category;
      if (sizeId) query.size_id = sizeId;
      if (startDate) query.start_date = startDate;
      if (endDate) query.end_date = endDate;

      const res = await api.getAdminRegistrations(query);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRegistrations();
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setUnit('');
    setClassId('');
    setCategory('');
    setSizeId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.downloadAdminExport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inscricoes-ultra-volleyball.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar inscrições:', err);
    }
  };

  // Distinct units from classes
  const uniqueUnits = Array.from(new Set(classes.map((c) => c.unit))).filter(Boolean);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
            Confirmada
          </span>
        );
      case 'pending_payment':
      case 'processing_payment':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
            Aguardando
          </span>
        );
      case 'payment_failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800">
            Falhou
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Action (Rule 60 & 61) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Inscrições
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total de {total} inscrições registradas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Inscrições (CSV)</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar (Rule 54 & 55) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por código, nome do aluno ou turma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-600"
            />
          </form>

          {/* Quick Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white outline-none focus:border-blue-600 font-semibold"
          >
            <option value="">Todos os status</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending_payment">Aguardando Pagamento</option>
            <option value="payment_failed">Falhas</option>
          </select>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              filterDrawerOpen || unit || classId || category || sizeId || startDate
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Avançados</span>
          </button>
        </div>

        {/* Expanded Filters Drawer */}
        {filterDrawerOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Unidade */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unidade</label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              >
                <option value="">Todas as unidades</option>
                {uniqueUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Turma */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Turma Específica</label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              >
                <option value="">Todas as turmas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              >
                <option value="">Adulto e Infantil</option>
                <option value="adult">Adulto</option>
                <option value="child">Infantil</option>
              </select>
            </div>

            {/* Tamanho */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tamanho Camiseta</label>
              <select
                value={sizeId}
                onChange={(e) => {
                  setSizeId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              >
                <option value="">Todos os tamanhos</option>
                {shirtSizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} ({s.category === 'adult' ? 'Adulto' : 'Infantil'})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inscrições Table (Rule 53) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome do Inscrito</th>
                <th className="py-3 px-4">Unidade / Turma</th>
                <th className="py-3 px-4">Tamanho</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Carregando inscrições...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhuma inscrição encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {r.public_code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {r.participant_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate" title={r.class_label_snapshot}>
                      {r.class_label_snapshot}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-800">
                      {r.shirt_size_code_snapshot}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.shirt_category_snapshot === 'adult' ? 'Adulto' : 'Infantil'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      R$ {(r.amount / 100).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 capitalize font-medium">
                        {r.payment_status === 'paid' ? 'Pago' : r.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <a
                        href={`/admin/inscricoes/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({total} inscrições)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 cursor-pointer"
              >
                Próxima <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
