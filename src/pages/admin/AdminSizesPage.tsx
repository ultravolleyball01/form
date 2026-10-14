import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ShirtSize } from '../../types';
import { Plus, Edit2, Check, X, Ruler, AlertCircle } from 'lucide-react';

export const AdminSizesPage: React.FC = () => {
  const [sizes, setSizes] = useState<ShirtSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<ShirtSize | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [category, setCategory] = useState<'adult' | 'child'>('adult');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSizes();
  }, []);

  const loadSizes = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminShirtSizes();
      setSizes(data);
    } catch (err) {
      console.error('Error loading sizes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSize(null);
    setCode('');
    setName('');
    setWidthCm('');
    setLengthCm('');
    setCategory('adult');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ShirtSize) => {
    setEditingSize(s);
    setCode(s.code);
    setName(s.name);
    setWidthCm(String(s.width_cm));
    setLengthCm(String(s.length_cm));
    setCategory(s.category);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const width = parseFloat(widthCm.replace(',', '.'));
    const length = parseFloat(lengthCm.replace(',', '.'));

    if (!code.trim()) {
      setError('O código do tamanho é obrigatório (ex: GG, M INF.).');
      return;
    }

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(length) || length <= 0) {
      setError('Largura e comprimento devem ser números válidos em centímetros.');
      return;
    }

    try {
      setSaving(true);
      if (editingSize) {
        await api.updateShirtSize(editingSize.id, {
          code: code.trim(),
          name: name.trim() || `${code.trim()} ${category === 'adult' ? 'Adulto' : 'Infantil'}`,
          width_cm: width,
          length_cm: length,
          category,
        });
      } else {
        await api.createShirtSize({
          code: code.trim(),
          name: name.trim() || `${code.trim()} ${category === 'adult' ? 'Adulto' : 'Infantil'}`,
          width_cm: width,
          length_cm: length,
          category,
        });
      }
      setModalOpen(false);
      loadSizes();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar tamanho');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: ShirtSize) => {
    try {
      await api.updateShirtSize(s.id, { active: !s.active });
      loadSizes();
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const adultSizes = sizes.filter((s) => s.category === 'adult');
  const childSizes = sizes.filter((s) => s.category === 'child');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Tamanhos e Medidas
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cadastre dimensões de camisetas. Os valores alimentam o formulário e a tabela de medidas automaticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Tamanho</span>
        </button>
      </div>

      {/* Adult Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Tamanhos Adulto ({adultSizes.length})
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome Descritivo</th>
                <th className="py-3 px-4 text-right">Largura (cm)</th>
                <th className="py-3 px-4 text-right">Comprimento (cm)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adultSizes.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !s.active ? 'opacity-50 bg-slate-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-black text-slate-900 text-sm">{s.code}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    {s.width_cm.toFixed(1).replace('.', ',')} cm
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    {s.length_cm.toFixed(1).replace('.', ',')} cm
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        s.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {s.active ? (
                        <>
                          <Check className="w-3 h-3" /> Ativo
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Child Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Tamanhos Infantil ({childSizes.length})
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome Descritivo</th>
                <th className="py-3 px-4 text-right">Largura (cm)</th>
                <th className="py-3 px-4 text-right">Comprimento (cm)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {childSizes.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !s.active ? 'opacity-50 bg-slate-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-black text-amber-950 text-sm">{s.code}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    {s.width_cm.toFixed(1).replace('.', ',')} cm
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    {s.length_cm.toFixed(1).replace('.', ',')} cm
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        s.active
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {s.active ? (
                        <>
                          <Check className="w-3 h-3" /> Ativo
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Size Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                {editingSize ? 'Editar Tamanho' : 'Cadastrar Tamanho'}
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

            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Código do Tamanho *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: GG, M, PP INF."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'adult' | 'child')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="adult">Adulto</option>
                    <option value="child">Infantil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Amigável
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: GG Adulto, G Infantil"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Largura (cm) *
                  </label>
                  <input
                    type="text"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    placeholder="Ex: 58.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Comprimento (cm) *
                  </label>
                  <input
                    type="text"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="Ex: 78.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    required
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
                  {saving ? 'Salvando...' : 'Salvar Tamanho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
