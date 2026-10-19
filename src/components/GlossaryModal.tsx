import React, { useState } from 'react';
import { X, BookMarked, Plus, Trash2, Tag, Info } from 'lucide-react';
import { GlossaryItem } from '../types';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  glossary: GlossaryItem[];
  onAddGlossaryItem: (item: Omit<GlossaryItem, 'id'>) => void;
  onDeleteGlossaryItem: (id: string) => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  onClose,
  glossary,
  onAddGlossaryItem,
  onDeleteGlossaryItem,
}) => {
  if (!isOpen) return null;

  const [sourceTerm, setSourceTerm] = useState('');
  const [targetTerm, setTargetTerm] = useState('');
  const [category, setCategory] = useState<GlossaryItem['category']>('general');
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTerm.trim() || !targetTerm.trim()) return;
    onAddGlossaryItem({
      source: sourceTerm.trim(),
      target: targetTerm.trim(),
      category,
      notes: notes.trim(),
    });
    setSourceTerm('');
    setTargetTerm('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base font-['Cairo']">
                قاموس مصطلحات وأسماء المانجا (Glossary)
              </h3>
              <p className="text-xs text-slate-400">
                فرض ترجمة ثابتة لأسماء الشخصيات والتقنيات والألقاب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add new term form */}
        <form onSubmit={handleAdd} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 my-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1 font-['Cairo']">
                المصطلح الأصلي (Source Term):
              </label>
              <input
                type="text"
                value={sourceTerm}
                onChange={(e) => setSourceTerm(e.target.value)}
                placeholder="مثال: Bankai / Nakama"
                className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1 font-['Cairo']">
                الترجمة المعتمدة (Target):
              </label>
              <input
                type="text"
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                placeholder="مثال: بانكاي / رفاقي"
                dir="rtl"
                className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-['Cairo']"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-300 font-['Cairo']"
            >
              <option value="general">عام / سياقي</option>
              <option value="character">اسم شخصية</option>
              <option value="attack">هجوم أو تقنية</option>
              <option value="honorific">لقب احترام (Senpai, Sensei)</option>
              <option value="place">مكان أو عالم</option>
            </select>

            <button
              type="submit"
              disabled={!sourceTerm.trim() || !targetTerm.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-colors font-['Cairo'] disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للقائمة</span>
            </button>
          </div>
        </form>

        {/* Existing Glossary Items */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {glossary.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-purple-300">
                  {item.source}
                </span>
                <span className="text-slate-500 text-xs">➔</span>
                <span className="font-bold text-xs text-white font-['Cairo']" dir="rtl">
                  {item.target}
                </span>
                {item.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                    {item.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => onDeleteGlossaryItem(item.id)}
                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
