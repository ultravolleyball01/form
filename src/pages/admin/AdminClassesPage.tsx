import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ClassItem } from '../../types';
import { Plus, Edit2, Check, X, Search, Users, AlertCircle } from 'lucide-react';

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Modal form state
  const [displayLabel, setDisplayLabel] = useState('');
  const [unit, setUnit] = useState('BATALHA');
  const [category, setCategory] = useState('INFANTIL');
  const [gender, setGender] = useState('MISTO');
  const [level, setLevel] = useState('INICIANTE');
  const [weekday, setWeekday] = useState('SEGUNDA');
  const [startTime, setStartTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminClasses();
      setClasses(data);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setDisplayLabel('');
    setUnit('BATALHA');
    setCategory('INFANTIL');
    setGender('MISTO');
    setLevel('INICIANTE');
    setWeekday('SEGUNDA');
    setStartTime('09:00');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setDisplayLabel(c.display_label);
    setUnit(c.unit);
    setCategory(c.category);
    setGender(c.gender);
    setLevel(c.level);
    setWeekday(c.weekday);
    setStartTime(c.start_time);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayLabel.trim()) {
      setError('O nome/descrição da turma é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          display_label: displayLabel.trim(),
          unit,
          category,
          gender,
          level,
          weekday,
          start_time: startTime,
        });
      } else {
        await api.createClass({
          display_label: displayLabel.trim(),
          unit,
          category,
          gender,
          level,
          weekday,
          start_time: startTime,
        });
      }
      setModalOpen(false);
      loadClasses();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar turma');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: ClassItem) => {
    try {
      await api.updateClass(c.id, { active: !c.active });
      loadClasses();
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const filtered = classes.filter((c) =>
    c.display_label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Unidades e Turmas
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gerencie os horários e polos de treino da Ultra Volleyball ({classes.length} cadastradas)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Turma</span>
        </button>
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Pesquisar turma por nome, unidade ou dia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Turma / Descrição</th>
                <th className="py-3 px-4">Unidade</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Horário / Dia</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Carregando turmas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhuma turma encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !c.active ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {c.display_label}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[11px]">
                        {c.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.category} • {c.gender}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.weekday} {c.start_time}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          c.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Ativar ou desativar turma"
                      >
                        {c.active ? (
                          <>
                            <Check className="w-3 h-3" /> Ativa
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" /> Inativa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                {editingClass ? 'Editar Turma' : 'Cadastrar Nova Turma'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 py-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo de Exibição da Turma *
                </label>
                <input
                  type="text"
                  value={displayLabel}
                  onChange={(e) => setDisplayLabel(e.target.value)}
                  placeholder="Ex: UNIDADE BATALHA - INFANTIL SEGUNDA 09HS"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value.toUpperCase())}
                    placeholder="Ex: BATALHA, TATUAPÉ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="INFANTIL">INFANTIL</option>
                    <option value="ADULTO">ADULTO</option>
                    <option value="JUVENIL">JUVENIL</option>
                    <option value="GERAL">GERAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="MISTO">MISTO</option>
                    <option value="FEMININO">FEMININO</option>
                    <option value="MASCULINO">MASCULINO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nível
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="Ex: INICIANTE, AVANÇADO"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dia da Semana
                  </label>
                  <input
                    type="text"
                    value={weekday}
                    onChange={(e) => setWeekday(e.target.value)}
                    placeholder="Ex: SEGUNDA, TERÇA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Horário Início
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="Ex: 09:00, 17:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow transition-all cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
