import React from 'react';
import {
  Zap,
  Crop,
  Search,
  Repeat,
  Volume2,
  Copy,
  Settings,
  Globe,
  Sparkles,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { ArcAction } from '../types';

interface ArcMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: ArcAction) => void;
  isAutoLoopActive: boolean;
  eraseOriginalText: boolean;
  isProcessing: boolean;
  sourceLang: string;
  targetLang: string;
}

export const ArcMenu: React.FC<ArcMenuProps> = ({
  isOpen,
  onClose,
  onAction,
  isAutoLoopActive,
  eraseOriginalText,
  isProcessing,
  sourceLang,
  targetLang
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'translate_screen' as ArcAction,
      label: 'ترجمة كاملة',
      sublabel: 'Full Scan',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
      active: isProcessing,
    },
    {
      id: 'crop_region' as ArcAction,
      label: 'اقتصاص فقاعة',
      sublabel: 'Crop Area',
      icon: Crop,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'word_inspect' as ArcAction,
      label: 'فحص الكلمات',
      sublabel: 'Word Dictionary',
      icon: Search,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'auto_loop' as ArcAction,
      label: isAutoLoopActive ? 'إيقاف المراقبة' : 'مراقبة مستمرة',
      sublabel: 'Auto-Translate Loop',
      icon: Repeat,
      color: isAutoLoopActive ? 'from-emerald-500 to-teal-600 ring-2 ring-emerald-400' : 'from-slate-600 to-slate-700',
      badge: isAutoLoopActive ? 'نشط' : undefined,
    },
    {
      id: 'quick_switch' as ArcAction,
      label: `${sourceLang} إلى ${targetLang}`,
      sublabel: 'تبديل اللغات',
      icon: Globe,
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'tts_speak' as ArcAction,
      label: 'قراءة صوتية',
      sublabel: 'TTS Speak',
      icon: Volume2,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'toggle_erase' as ArcAction,
      label: eraseOriginalText ? 'إخفاء النص الأصلي' : 'إظهار النصين',
      sublabel: 'Inpainting Mask',
      icon: eraseOriginalText ? EyeOff : Eye,
      color: 'from-teal-500 to-cyan-600',
    },
    {
      id: 'copy_text' as ArcAction,
      label: 'نسخ الترجمة',
      sublabel: 'Copy Text',
      icon: Copy,
      color: 'from-zinc-600 to-zinc-700',
    },
    {
      id: 'settings' as ArcAction,
      label: 'الإعدادات والخطوط',
      sublabel: 'Settings',
      icon: Settings,
      color: 'from-gray-700 to-gray-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-purple-500/30 rounded-3xl p-6 shadow-2xl shadow-purple-950/60 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-['Cairo'] flex items-center gap-2">
                قائمة مانجا لينجو العائمة
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MangaLingo
                </span>
              </h3>
              <p className="text-xs text-slate-400">تحكم فوري بترجمة الفقاعات والمانجا</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-3 gap-3 my-5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onAction(act.id);
                  if (act.id !== 'auto_loop' && act.id !== 'toggle_erase') {
                    onClose();
                  }
                }}
                disabled={isProcessing && act.id === 'translate_screen'}
                className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 hover:border-purple-500/50 transition-all duration-200 hover:scale-105 active:scale-95 text-center"
              >
                {act.badge && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500 text-black shadow">
                    {act.badge}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center shadow-md mb-2 group-hover:shadow-purple-500/30 transition-shadow`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-100 font-['Cairo'] line-clamp-1">
                  {act.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {act.sublabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            محرك الذكاء الاصطناعي: Gemini 3.8 Flash
          </span>
          <button
            onClick={() => {
              onAction('settings');
              onClose();
            }}
            className="text-purple-400 hover:text-purple-300 underline font-['Cairo']"
          >
            تخصيص الخط واللغة
          </button>
        </div>
      </div>
    </div>
  );
};
