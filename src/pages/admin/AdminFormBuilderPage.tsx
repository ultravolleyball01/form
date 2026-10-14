import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { FormField, FormFieldType } from '../../types';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  AlertCircle,
  Shield,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react';

export const AdminFormBuilderPage: React.FC = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  // Form modal state
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminFormFields();
      setFields(data);
    } catch (err) {
      console.error('Error loading form fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingField(null);
    setLabel('');
    setDescription('');
    setFieldType('text');
    setPlaceholder('');
    setRequired(false);
    setOptionsStr('');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (field: FormField) => {
    setEditingField(field);
    setLabel(field.label);
    setDescription(field.description || '');
    setFieldType(field.field_type);
    setPlaceholder(field.placeholder || '');
    setRequired(field.required);
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setError('');
    setModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!label.trim()) {
      setError('O nome da pergunta é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      const options = optionsStr
        ? optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      if (editingField) {
        await api.updateFormField(editingField.id, {
          label: label.trim(),
          description: description.trim(),
          placeholder: placeholder.trim(),
          required,
          options,
        });
      } else {
        await api.createFormField({
          label: label.trim(),
          description: description.trim(),
          field_type: fieldType,
          placeholder: placeholder.trim(),
          required,
          options,
        });
      }

      setModalOpen(false);
      loadFields();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar pergunta');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (field: FormField) => {
    try {
      await api.updateFormField(field.id, { active: !field.active });
      loadFields();
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, moved);

    setFields(newFields);
    try {
      await api.reorderFormFields(newFields.map((f) => f.id));
    } catch (err) {
      console.error('Error reordering fields:', err);
      loadFields();
    }
  };

  const formatTypeLabel = (f: FormField) => {
    if (f.system_type === 'full_name') return 'Nome (Sistema)';
    if (f.system_type === 'class_id') return 'Turmas (Sistema)';
    if (f.system_type === 'shirt_size_id') return 'Tamanhos (Sistema)';

    const map: Record<string, string> = {
      text: 'Texto curto',
      textarea: 'Texto longo (Área)',
      select: 'Seleção (Menu)',
      radio: 'Múltipla escolha (Radio)',
      checkbox: 'Caixas de seleção',
      date: 'Data',
      number: 'Número',
      email: 'E-mail',
      phone: 'Telefone',
    };
    return map[f.field_type] || f.field_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Perguntas do Formulário
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gerencie e adicione perguntas personalizadas sem necessidade de novo deploy
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Pergunta</span>
        </button>
      </div>

      {/* Info notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Campos Protegidos do Sistema:</span>
          <p className="text-blue-800 mt-0.5">
            Nome Completo, Unidade/Turma e Tamanho da Camiseta são perguntas estruturais protegidas. Você pode personalizar o texto e a posição, mas sua regra de negócio permanece garantida.
          </p>
        </div>
      </div>

      {/* Questions list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Ordem</th>
                <th className="py-3 px-4">Pergunta (Label)</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-center">Obrigatório</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Carregando perguntas...
                  </td>
                </tr>
              ) : (
                fields.map((f, index) => (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !f.active ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Sort Order buttons (Rule 23) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-slate-500 w-4 text-center">
                          {f.sort_order}
                        </span>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Question Label */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {f.system_type && (
                          <span title="Pergunta Estrutural do Sistema" className="cursor-help">
                            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          </span>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{f.label}</span>
                          {f.description && (
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {f.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {formatTypeLabel(f)}
                      </span>
                    </td>

                    {/* Required */}
                    <td className="py-3 px-4 text-center">
                      {f.required ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Sim
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Opcional</span>
                      )}
                    </td>

                    {/* Active toggle (Rule 24) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(f)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          f.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {f.active ? (
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

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(f)}
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

      {/* Add / Edit Question Modal (Rule 21 & 22) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                {editingField ? 'Editar Pergunta' : 'Nova Pergunta'}
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

            <form onSubmit={handleSaveField} className="space-y-4 py-4 overflow-y-auto flex-1">
              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Texto da Pergunta (Label) *
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Posição preferida na quadra"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instrução / Descrição Auxiliar
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Informe sua posição principal (ex: Levantador, Ponteiro)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Type (Disabled if system field) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo da Pergunta
                </label>
                {editingField?.system_type ? (
                  <p className="text-xs text-blue-700 font-semibold p-2 bg-blue-50 rounded-lg">
                    Pergunta estrutural do sistema ({editingField.system_type}). Tipo fixo.
                  </p>
                ) : (
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as FormFieldType)}
                    disabled={Boolean(editingField?.system_type)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="text">Texto simples</option>
                    <option value="textarea">Texto longo (Área de texto)</option>
                    <option value="select">Seleção única (Dropdown)</option>
                    <option value="radio">Múltipla escolha (Radio)</option>
                    <option value="checkbox">Caixas de seleção (Checkbox)</option>
                    <option value="date">Data</option>
                    <option value="number">Número</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                  </select>
                )}
              </div>

              {/* Options for select / radio / checkbox */}
              {(fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') &&
                !editingField?.system_type && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Opções (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={optionsStr}
                      onChange={(e) => setOptionsStr(e.target.value)}
                      placeholder="Ex: Levantador, Líbero, Ponteiro, Central, Oposto"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

              {/* Placeholder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Texto de Exemplo (Placeholder)
                </label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Ex: Digite sua resposta..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Required checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Esta pergunta é de preenchimento obrigatório
                  </span>
                </label>
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
                  {saving ? 'Salvando...' : 'Salvar Pergunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
