import React from 'react';
import { X, Settings, Type, Sparkles, Sliders, Volume2, Globe } from 'lucide-react';
import { TranslationPreset } from '../types';
import { ARABIC_FONTS, SUPPORTED_LANGUAGES } from '../utils/defaultData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: TranslationPreset;
  onUpdatePreset: (updated: TranslationPreset) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preset,
  onUpdatePreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-base font-['Cairo']">
                إعدادات MangaLingo وترجمة المانجا
              </h3>
              <p className="text-xs text-slate-400">
                تخصيص الخطوط العربية، المحو الذكي، ونطق الأصوات
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

        <div className="space-y-5 my-4">
          {/* Languages selection */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-1.5 font-['Cairo']">
              <Globe className="w-4 h-4" />
              زوج لغات الترجمة (Language Pair):
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-['Cairo']">
                  لغة المانجا الأصلية:
                </label>
                <select
                  value={preset.sourceLang}
                  onChange={(e) => onUpdatePreset({ ...preset, sourceLang: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-['Cairo']"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-['Cairo']">
                  اللغة المستهدفة للترجمة:
                </label>
                <select
                  value={preset.targetLang}
                  onChange={(e) => onUpdatePreset({ ...preset, targetLang: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-['Cairo']"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Arabic Typography Section */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-1.5 font-['Cairo']">
              <Type className="w-4 h-4" />
              خط المانجا العربي والحجم (Manga Typography):
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-['Cairo']">
                  نوع الخط العربي المخصص:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ARABIC_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => onUpdatePreset({ ...preset, fontFamily: font.id as any })}
                      className={`p-2.5 rounded-xl border text-right transition-all ${
                        preset.fontFamily === font.id
                          ? 'border-purple-400 bg-purple-600/20 text-white shadow-md'
                          : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold block" style={{ fontFamily: font.id }}>
                        {font.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Scale slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-['Cairo']">
                  <span>مقياس حجم الخط داخل الفقاعات:</span>
                  <span className="text-purple-300 font-bold">{Math.round(preset.fontSizeScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={preset.fontSizeScale}
                  onChange={(e) => onUpdatePreset({ ...preset, fontSizeScale: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Inpainting & Eraser Settings */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-1.5 font-['Cairo']">
              <Sparkles className="w-4 h-4" />
              المحو الذكي للفقاعات (Inpainting):
            </h4>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <span className="text-xs font-bold text-slate-200 font-['Cairo']">
                  مسح النص الأصلي وتغطية الفقاعة بلون متطابق
                </span>
                <input
                  type="checkbox"
                  checked={preset.eraseOriginalText}
                  onChange={(e) => onUpdatePreset({ ...preset, eraseOriginalText: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </label>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-['Cairo']">
                  <span>عتامة خلفية الفقاعة (Opacity):</span>
                  <span className="text-purple-300 font-bold">{Math.round(preset.bubbleOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={preset.bubbleOpacity}
                  onChange={(e) => onUpdatePreset({ ...preset, bubbleOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Auto Loop Interval */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1 font-['Cairo']">
              <span>فترة المراقبة التلقائية للترجمة (Auto-Loop):</span>
              <span className="text-emerald-400 font-mono">{preset.autoLoopIntervalSec} ثوانٍ</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={preset.autoLoopIntervalSec}
              onChange={(e) => onUpdatePreset({ ...preset, autoLoopIntervalSec: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-all font-['Cairo']"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
