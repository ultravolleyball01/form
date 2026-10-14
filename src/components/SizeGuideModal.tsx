import React from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';
import type { ShirtSize } from '../types';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizes: ShirtSize[];
  selectedSizeId?: string;
  onSelectSize?: (sizeId: string) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  sizes,
  selectedSizeId,
  onSelectSize,
}) => {
  if (!isOpen) return null;

  const adultSizes = sizes.filter((s) => s.category === 'adult');
  const childSizes = sizes.filter((s) => s.category === 'child');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-md">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Tabela Oficial de Medidas</h3>
              <p className="text-xs text-blue-200">Dimensões em centímetros (Largura x Comprimento)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Instructions banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-900">
            <span className="text-xl">📏</span>
            <div>
              <p className="font-semibold text-blue-950">Como medir corretamente sua camiseta:</p>
              <p className="text-xs text-blue-800 mt-1">
                • <strong>Largura:</strong> Medida de axila a axila (horizontal com a peça esticada).<br />
                • <strong>Comprimento:</strong> Do ponto mais alto do ombro até a barra inferior.
              </p>
            </div>
          </div>

          {/* Adult Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Tamanhos Adulto
              </h4>
              <span className="text-xs text-slate-500 font-medium">{adultSizes.length} tamanhos disponíveis</span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Tamanho</th>
                    <th className="py-2.5 px-4 text-right">Largura (cm)</th>
                    <th className="py-2.5 px-4 text-right">Comprimento (cm)</th>
                    {onSelectSize && <th className="py-2.5 px-4 text-center">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adultSizes.map((s) => {
                    const isSelected = selectedSizeId === s.id;
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-medium text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-bold flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs">
                            {s.code}
                          </span>
                          <span className="text-xs text-slate-500 hidden sm:inline">{s.name}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{s.width_cm.toFixed(1).replace('.', ',')} cm</td>
                        <td className="py-2.5 px-4 text-right font-mono">{s.length_cm.toFixed(1).replace('.', ',')} cm</td>
                        {onSelectSize && (
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSize(s.id);
                                onClose();
                              }}
                              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow'
                                  : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Selecionado' : 'Escolher'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Child Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Tamanhos Infantil
              </h4>
              <span className="text-xs text-slate-500 font-medium">{childSizes.length} tamanhos disponíveis</span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Tamanho</th>
                    <th className="py-2.5 px-4 text-right">Largura (cm)</th>
                    <th className="py-2.5 px-4 text-right">Comprimento (cm)</th>
                    {onSelectSize && <th className="py-2.5 px-4 text-center">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childSizes.map((s) => {
                    const isSelected = selectedSizeId === s.id;
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-amber-50/50 transition-colors ${
                          isSelected ? 'bg-amber-50/80 font-medium text-amber-900' : 'text-slate-700'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-bold flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-bold">
                            {s.code}
                          </span>
                          <span className="text-xs text-slate-500 hidden sm:inline">{s.name}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{s.width_cm.toFixed(1).replace('.', ',')} cm</td>
                        <td className="py-2.5 px-4 text-right font-mono">{s.length_cm.toFixed(1).replace('.', ',')} cm</td>
                        {onSelectSize && (
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSize(s.id);
                                onClose();
                              }}
                              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-white shadow'
                                  : 'bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Selecionado' : 'Escolher'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar Tabela
          </button>
        </div>
      </div>
    </div>
  );
};
