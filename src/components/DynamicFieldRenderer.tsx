import React, { useState } from 'react';
import { Ruler, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import type { FormField, ClassItem, ShirtSize } from '../types';

interface DynamicFieldRendererProps {
  field: FormField;
  value: any;
  onChange: (val: any) => void;
  classes?: ClassItem[];
  shirtSizes?: ShirtSize[];
  onOpenSizeGuide?: () => void;
  error?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  classes = [],
  shirtSizes = [],
  onOpenSizeGuide,
  error,
}) => {
  const [classSearch, setClassSearch] = useState('');
  const [sizeTab, setSizeTab] = useState<'adult' | 'child'>('adult');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  // 1. System Field: FULL NAME
  if (field.system_type === 'full_name') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-slate-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-slate-500">{field.description}</p>
        )}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Nome completo do aluno(a)'}
          className={`w-full px-4 py-3 text-base rounded-xl border bg-white text-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
          }`}
          autoComplete="name"
        />
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      </div>
    );
  }

  // 2. System Field: CLASS SELECTOR
  if (field.system_type === 'class_id' || field.field_type === 'class_selector') {
    const selectedClass = classes.find((c) => c.id === value);
    const filteredClasses = classes.filter((c) =>
      c.display_label.toLowerCase().includes(classSearch.toLowerCase())
    );

    // Group filtered classes by Unit
    const grouped = filteredClasses.reduce((acc, curr) => {
      const u = curr.unit || 'OUTRAS';
      if (!acc[u]) acc[u] = [];
      acc[u].push(curr);
      return acc;
    }, {} as Record<string, ClassItem[]>);

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-slate-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-slate-500">{field.description}</p>
        )}

        {/* Selected badge / trigger */}
        <div className="relative">
          <div
            onClick={() => setClassDropdownOpen(!classDropdownOpen)}
            className={`w-full min-h-[52px] px-4 py-3 rounded-xl border bg-white flex items-center justify-between cursor-pointer transition-all ${
              classDropdownOpen
                ? 'ring-2 ring-blue-600 border-transparent shadow-sm'
                : error
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {selectedClass ? (
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-900 text-sm">
                  {selectedClass.display_label}
                </span>
                <span className="text-xs text-blue-700 font-medium">
                  {selectedClass.category} • {selectedClass.weekday} {selectedClass.start_time}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">
                {field.placeholder || 'Clique para selecionar sua turma...'}
              </span>
            )}
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                classDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </div>

          {classDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-30 p-3 max-h-80 overflow-hidden flex flex-col">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar unidade, dia ou horário..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {Object.keys(grouped).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma turma encontrada</p>
                ) : (
                  Object.entries(grouped).map(([unitName, unitClasses]) => (
                    <div key={unitName}>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50/80 px-2 py-1 rounded mb-1">
                        UNIDADE {unitName}
                      </div>
                      <div className="space-y-1">
                        {unitClasses.map((item) => {
                          const isSelected = value === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onChange(item.id);
                                setClassDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span>{item.display_label}</span>
                              {isSelected && <Check className="w-4 h-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      </div>
    );
  }

  // 3. System Field: SHIRT SIZE SELECTOR
  if (field.system_type === 'shirt_size_id' || field.field_type === 'shirt_size_selector') {
    const adultSizes = shirtSizes.filter((s) => s.category === 'adult');
    const childSizes = shirtSizes.filter((s) => s.category === 'child');
    const selectedSize = shirtSizes.find((s) => s.id === value);

    const currentSizes = sizeTab === 'adult' ? adultSizes : childSizes;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-slate-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {onOpenSizeGuide && (
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline transition-colors cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              Ver tabela de medidas
            </button>
          )}
        </div>

        {field.description && (
          <p className="text-xs text-slate-500">{field.description}</p>
        )}

        {/* Tab switcher: Adulto vs Infantil */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSizeTab('adult')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              sizeTab === 'adult'
                ? 'bg-blue-700 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adulto ({adultSizes.length} tamanhos)
          </button>
          <button
            type="button"
            onClick={() => setSizeTab('child')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              sizeTab === 'child'
                ? 'bg-amber-500 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Infantil ({childSizes.length} tamanhos)
          </button>
        </div>

        {/* Size cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {currentSizes.map((s) => {
            const isSelected = value === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange(s.id)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                  isSelected
                    ? sizeTab === 'adult'
                      ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-600 text-blue-900'
                      : 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-500 text-amber-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                {isSelected && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white ${
                      sizeTab === 'adult' ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <span className="text-base font-extrabold tracking-tight">{s.code}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {s.width_cm} x {s.length_cm} cm
                </span>
              </button>
            );
          })}
        </div>

        {selectedSize && (
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <span>
              Tamanho selecionado: <strong>{selectedSize.code}</strong> (
              {selectedSize.category === 'adult' ? 'Adulto' : 'Infantil'})
            </span>
            <span className="font-mono text-slate-500">
              Largura: {selectedSize.width_cm}cm • Comprimento: {selectedSize.length_cm}cm
            </span>
          </div>
        )}

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      </div>
    );
  }

  // 4. Custom Field Types
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-800">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500">{field.description}</p>
      )}

      {/* TEXT / EMAIL / PHONE / NUMBER / DATE */}
      {(field.field_type === 'text' ||
        field.field_type === 'email' ||
        field.field_type === 'phone' ||
        field.field_type === 'number' ||
        field.field_type === 'date') && (
        <input
          type={
            field.field_type === 'phone'
              ? 'tel'
              : field.field_type === 'email'
              ? 'email'
              : field.field_type === 'number'
              ? 'number'
              : field.field_type === 'date'
              ? 'date'
              : 'text'
          }
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className={`w-full px-4 py-3 text-base rounded-xl border bg-white text-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
          }`}
        />
      )}

      {/* TEXTAREA */}
      {field.field_type === 'textarea' && (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className={`w-full px-4 py-3 text-base rounded-xl border bg-white text-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
          }`}
        />
      )}

      {/* SELECT */}
      {field.field_type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 text-base rounded-xl border bg-white text-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <option value="">{field.placeholder || 'Selecione uma opção...'}</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* RADIO */}
      {field.field_type === 'radio' && (
        <div className="space-y-2 pt-1">
          {(field.options || []).map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`field_${field.id}`}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* CHECKBOX */}
      {field.field_type === 'checkbox' && (
        <div className="space-y-2 pt-1">
          {(field.options || []).map((opt, i) => {
            const currentArr: string[] = Array.isArray(value) ? value : [];
            const isChecked = currentArr.includes(opt);
            return (
              <label
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...currentArr, opt]);
                    } else {
                      onChange(currentArr.filter((item) => item !== opt));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-800">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};
