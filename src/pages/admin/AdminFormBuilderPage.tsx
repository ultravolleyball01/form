import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { FormAppearance, FormConditionOperator, FormField, FormFieldType } from '../../types';
import { AlertCircle, ArrowDown, ArrowUp, Check, Edit2, Eye, Image, Plus, Save, Shield, SlidersHorizontal, X } from 'lucide-react';

const EMPTY_APPEARANCE: FormAppearance = {
  eyebrow: '', title: '', description: '', primary_logo_url: '', secondary_logo_url: '',
  header_banner_url: '', submit_label: '', success_title: '', success_description: '', payment_enabled: false,
  maps_enabled: false, maps_api_key: '', location_bsc_address: '', location_colegio_address: '',
};

export const AdminFormBuilderPage: React.FC = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [appearance, setAppearance] = useState<FormAppearance>(EMPTY_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [appearanceMessage, setAppearanceMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [conditionEnabled, setConditionEnabled] = useState(false);
  const [conditionFieldId, setConditionFieldId] = useState('');
  const [conditionOperator, setConditionOperator] = useState<FormConditionOperator>('greater_than_or_equal');
  const [conditionValue, setConditionValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fieldData, appearanceData] = await Promise.all([
        api.getAdminFormFields(), api.getAdminFormAppearance(),
      ]);
      setFields(fieldData);
      setAppearance(appearanceData);
    } catch (err) {
      console.error('Error loading form builder:', err);
    } finally { setLoading(false); }
  };

  const handleOpenAdd = () => {
    setEditingField(null); setLabel(''); setDescription(''); setFieldType('text');
    setPlaceholder(''); setRequired(false); setOptionsStr(''); setConditionEnabled(false);
    setConditionFieldId(''); setConditionOperator('greater_than_or_equal'); setConditionValue('');
    setError(''); setModalOpen(true);
  };

  const handleOpenEdit = (field: FormField) => {
    setEditingField(field); setLabel(field.label); setDescription(field.description || '');
    setFieldType(field.field_type); setPlaceholder(field.placeholder || '');
    setRequired(field.required); setOptionsStr(field.options?.join(', ') || '');
    setConditionEnabled(Boolean(field.show_when)); setConditionFieldId(field.show_when?.field_id || '');
    setConditionOperator(field.show_when?.operator || 'greater_than_or_equal');
    setConditionValue(field.show_when?.value || ''); setError(''); setModalOpen(true);
  };

  const handleSaveAppearance = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSavingAppearance(true); setAppearanceMessage('');
      setAppearance(await api.updateFormAppearance(appearance));
      setFields(await api.getAdminFormFields());
      setAppearanceMessage('Apresentação atualizada com sucesso.');
    } catch (err: any) {
      setAppearanceMessage(err.message || 'Não foi possível salvar a apresentação.');
    } finally { setSavingAppearance(false); }
  };

  const handleSaveField = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!label.trim()) { setError('O texto da pergunta é obrigatório.'); return; }
    if (conditionEnabled && (!conditionFieldId || !conditionValue.trim())) {
      setError('Escolha a pergunta de origem e informe o valor da condição.'); return;
    }
    const payload = {
      label: label.trim(), description: description.trim(), placeholder: placeholder.trim(), required,
      options: optionsStr.split(',').map((value) => value.trim()).filter(Boolean),
      show_when: conditionEnabled
        ? { field_id: conditionFieldId, operator: conditionOperator, value: conditionValue.trim() }
        : null,
    };
    try {
      setSaving(true);
      if (editingField) await api.updateFormField(editingField.id, payload);
      else await api.createFormField({ ...payload, field_type: fieldType });
      setModalOpen(false); await loadData();
    } catch (err: any) { setError(err.message || 'Erro ao salvar pergunta'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (field: FormField) => {
    try {
      const updated = await api.updateFormField(field.id, { active: !field.active });
      setFields((current) => current.map((item) => item.id === field.id ? updated : item));
    } catch (err) { console.error('Error toggling field:', err); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const reordered = [...fields]; const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved); setFields(reordered);
    try { await api.reorderFormFields(reordered.map((field) => field.id)); }
    catch { await loadData(); }
  };

  const typeLabel = (field: FormField) => {
    if (field.system_type === 'full_name') return 'Nome (sistema)';
    if (field.system_type === 'class_id') return 'Locais/horários';
    if (field.system_type === 'shirt_size_id') return 'Tamanhos';
    const labels: Record<string, string> = { text: 'Texto curto', textarea: 'Texto longo', select: 'Lista', radio: 'Escolha única', checkbox: 'Múltipla escolha', date: 'Data', number: 'Número', email: 'E-mail', phone: 'Telefone' };
    return labels[field.field_type] || field.field_type;
  };

  const conditionSources = fields.filter((field) => field.id !== editingField?.id && !field.system_type && field.field_type !== 'checkbox');

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Formulário geral</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Edite a identidade, o conteúdo e as perguntas sem precisar publicar uma nova versão.</p></div>
      <div className="flex gap-2"><a href="/" target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase flex items-center gap-2"><Eye className="w-4 h-4" /> Visualizar</a><button type="button" onClick={handleOpenAdd} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase flex items-center gap-2 shadow-md cursor-pointer"><Plus className="w-4 h-4" /> Adicionar pergunta</button></div>
    </div>

    <form onSubmit={handleSaveAppearance} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Image className="w-5 h-5" /></div><div><h2 className="font-black text-slate-900 uppercase">Identidade e textos</h2><p className="text-xs text-slate-500">Os dois logos podem usar uma URL pública ou um arquivo do site iniciado por /.</p></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Logo principal" value={appearance.primary_logo_url} onChange={(value) => setAppearance({ ...appearance, primary_logo_url: value })} placeholder="https://.../logo-ultra.png" />
        <FieldInput label="Logo secundário" value={appearance.secondary_logo_url} onChange={(value) => setAppearance({ ...appearance, secondary_logo_url: value })} placeholder="https://.../logo-parceiro.png" />
        <div className="md:col-span-2"><FieldInput label="Banner original do cabeçalho" value={appearance.header_banner_url} onChange={(value) => setAppearance({ ...appearance, header_banner_url: value })} placeholder="/assets/seletivas-batalha-2027.png" /></div>
        <FieldInput label="Selo acima do título" value={appearance.eyebrow} onChange={(value) => setAppearance({ ...appearance, eyebrow: value })} placeholder="PENEIRA ULTRA VOLLEYBALL" />
        <FieldInput label="Título" value={appearance.title} onChange={(value) => setAppearance({ ...appearance, title: value })} placeholder="Seleção de atletas" />
        <label className="md:col-span-2 text-xs font-bold text-slate-700 uppercase">Descrição<textarea value={appearance.description} onChange={(event) => setAppearance({ ...appearance, description: event.target.value })} rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm normal-case font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>
        <FieldInput label="Texto do botão" value={appearance.submit_label} onChange={(value) => setAppearance({ ...appearance, submit_label: value })} />
        <FieldInput label="Título da confirmação" value={appearance.success_title} onChange={(value) => setAppearance({ ...appearance, success_title: value })} />
        <label className="md:col-span-2 text-xs font-bold text-slate-700 uppercase">Mensagem de confirmação<textarea value={appearance.success_description} onChange={(event) => setAppearance({ ...appearance, success_description: event.target.value })} rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm normal-case font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2"><div><p className="text-xs font-bold text-slate-700">Pagamento de camiseta</p><p className="text-[11px] text-slate-500">Mantenha desligado para cadastros gratuitos. Ao ligar, a pergunta de tamanho é ativada automaticamente.</p></div><button type="button" onClick={() => setAppearance({ ...appearance, payment_enabled: !appearance.payment_enabled })} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold cursor-pointer ${appearance.payment_enabled ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}><span className={`w-8 h-4 rounded-full p-0.5 ${appearance.payment_enabled ? 'bg-amber-500' : 'bg-slate-300'}`}><span className={`block w-3 h-3 rounded-full bg-white transition-transform ${appearance.payment_enabled ? 'translate-x-4' : ''}`} /></span>{appearance.payment_enabled ? 'Ligado' : 'Desligado'}</button></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-700">Integração Google Maps</p><p className="text-[11px] text-slate-500">Preencha os endereços quando estiverem definidos. Restrinja a chave da API ao domínio do formulário.</p></div><button type="button" onClick={() => setAppearance({ ...appearance, maps_enabled: !appearance.maps_enabled })} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold cursor-pointer ${appearance.maps_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{appearance.maps_enabled ? 'Mapa ativo' : 'Mapa desativado'}</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><FieldInput label="Chave da Google Maps Embed API" value={appearance.maps_api_key} onChange={(value) => setAppearance({ ...appearance, maps_api_key: value })} placeholder="Será informada posteriormente" /></div>
          <FieldInput label="Endereço do BSC" value={appearance.location_bsc_address} onChange={(value) => setAppearance({ ...appearance, location_bsc_address: value })} placeholder="Endereço completo" />
          <FieldInput label="Endereço do Colégio" value={appearance.location_colegio_address} onChange={(value) => setAppearance({ ...appearance, location_colegio_address: value })} placeholder="Endereço completo" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className={`text-xs ${appearanceMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-600'}`}>{appearanceMessage}</span><button type="submit" disabled={savingAppearance || loading} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"><Save className="w-4 h-4" /> {savingAppearance ? 'Salvando...' : 'Salvar apresentação'}</button></div>
    </form>

    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900"><Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" /><p><strong>Todos os campos têm toggle.</strong> Campos estruturais também podem ser desativados; apenas seu tipo interno permanece protegido.</p></div>

    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200"><tr><th className="py-3 px-4 text-center">Ordem</th><th className="py-3 px-4">Pergunta</th><th className="py-3 px-4">Tipo</th><th className="py-3 px-4">Regra</th><th className="py-3 px-4 text-center">Status</th><th className="py-3 px-4 text-center">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">
      {loading ? <tr><td colSpan={6} className="py-10 text-center text-slate-400">Carregando formulário...</td></tr> : fields.map((field, index) => {
        const source = fields.find((item) => item.id === field.show_when?.field_id);
        return <tr key={field.id} className={!field.active ? 'opacity-60 bg-slate-50/60' : ''}>
          <td className="py-3 px-4"><div className="flex items-center justify-center gap-1"><button type="button" disabled={index === 0} onClick={() => handleMove(index, 'up')} className="p-1 disabled:opacity-20 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button><span className="font-mono text-slate-500 w-5 text-center">{index + 1}</span><button type="button" disabled={index === fields.length - 1} onClick={() => handleMove(index, 'down')} className="p-1 disabled:opacity-20 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button></div></td>
          <td className="py-3 px-4"><div className="flex items-start gap-2">{field.system_type && <Shield className="w-3.5 h-3.5 text-blue-600 mt-0.5" />}<div><p className="font-bold text-slate-900">{field.label}{field.required && <span className="text-red-500"> *</span>}</p><p className="text-[11px] text-slate-500 line-clamp-1">{field.description}</p></div></div></td>
          <td className="py-3 px-4"><span className="px-2 py-1 rounded bg-slate-100 text-slate-700">{typeLabel(field)}</span></td>
          <td className="py-3 px-4 text-[11px] text-slate-600">{field.show_when ? `Se “${source?.label || 'pergunta'}” ${field.show_when.operator === 'greater_than_or_equal' ? '≥' : field.show_when.operator === 'less_than_or_equal' ? '≤' : '='} ${field.show_when.value}` : 'Sempre visível'}</td>
          <td className="py-3 px-4 text-center"><button type="button" onClick={() => handleToggleActive(field)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold cursor-pointer ${field.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{field.active ? <><Check className="w-3 h-3" /> Ativo</> : <><X className="w-3 h-3" /> Inativo</>}</button></td>
          <td className="py-3 px-4 text-center"><button type="button" onClick={() => handleOpenEdit(field)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Editar</button></td>
        </tr>;
      })}
    </tbody></table></div></div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"><div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 flex flex-col max-h-[92vh]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100"><h3 className="text-base font-black uppercase text-slate-900">{editingField ? 'Editar pergunta' : 'Nova pergunta'}</h3><button type="button" onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button></div>
      {error && <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <form onSubmit={handleSaveField} className="space-y-4 py-4 overflow-y-auto">
        <FieldInput label="Texto da pergunta *" value={label} onChange={setLabel} placeholder="Ex: Qual é sua posição preferida?" />
        <FieldInput label="Descrição auxiliar" value={description} onChange={setDescription} />
        <label className="block text-xs font-bold text-slate-700 uppercase">Tipo da pergunta{editingField?.system_type ? <p className="mt-1 p-2 bg-blue-50 text-blue-700 normal-case rounded-lg">Tipo estrutural protegido: {typeLabel(editingField)}</p> : <select value={fieldType} onChange={(event) => setFieldType(event.target.value as FormFieldType)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-normal normal-case"><option value="text">Texto curto</option><option value="textarea">Texto longo</option><option value="select">Lista de seleção</option><option value="radio">Escolha única</option><option value="checkbox">Múltipla escolha</option><option value="date">Data</option><option value="number">Número</option><option value="email">E-mail</option><option value="phone">Telefone</option></select>}</label>
        {(['select', 'radio', 'checkbox'] as FormFieldType[]).includes(fieldType) && !editingField?.system_type && <FieldInput label="Opções separadas por vírgula" value={optionsStr} onChange={setOptionsStr} placeholder="Levantador, Líbero, Ponteiro" />}
        <FieldInput label="Texto de exemplo" value={placeholder} onChange={setPlaceholder} />
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} className="w-4 h-4" /> Pergunta obrigatória quando estiver visível</label>
        {!editingField?.system_type && <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3"><label className="flex items-center justify-between gap-3 cursor-pointer"><span><span className="text-xs font-black text-violet-900 uppercase flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5" /> Exibição condicional</span><span className="text-[11px] text-violet-700 block">Mostra esta pergunta conforme uma resposta anterior.</span></span><input type="checkbox" checked={conditionEnabled} onChange={(event) => setConditionEnabled(event.target.checked)} className="w-4 h-4" /></label>{conditionEnabled && <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><select value={conditionFieldId} onChange={(event) => setConditionFieldId(event.target.value)} className="sm:col-span-3 px-3 py-2 rounded-lg border border-violet-200 bg-white text-xs"><option value="">Pergunta de origem...</option>{conditionSources.map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select><select value={conditionOperator} onChange={(event) => setConditionOperator(event.target.value as FormConditionOperator)} className="px-3 py-2 rounded-lg border border-violet-200 bg-white text-xs"><option value="greater_than_or_equal">Maior ou igual</option><option value="less_than_or_equal">Menor ou igual</option><option value="equals">Igual a</option></select><input value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} placeholder="Ex: 2009" className="sm:col-span-2 px-3 py-2 rounded-lg border border-violet-200 text-xs" /></div>}</div>}
        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer">Cancelar</button><button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase cursor-pointer disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar pergunta'}</button></div>
      </form>
    </div></div>}
  </div>;
};

interface FieldInputProps { label: string; value: string; onChange: (value: string) => void; placeholder?: string; }
const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange, placeholder }) => <label className="block text-xs font-bold text-slate-700 uppercase">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm normal-case font-normal outline-none focus:ring-2 focus:ring-blue-600" /></label>;
