import React, { useState } from 'react';
import {
  X,
  Volume2,
  Copy,
  Check,
  Edit2,
  BookMarked,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { MangaBubble } from '../types';

interface TranslationCardProps {
  bubble: MangaBubble | null;
  onClose: () => void;
  onUpdateBubble: (updated: MangaBubble) => void;
  onAddToGlossary: (source: string, target: string) => void;
  sourceLang: string;
  targetLang: string;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
  bubble,
  onClose,
  onUpdateBubble,
  onAddToGlossary,
  sourceLang,
  targetLang
}) => {
  if (!bubble) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(bubble.translatedText);
  const [copiedType, setCopiedType] = useState<'translated' | 'original' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = (text: string, type: 'translated' | 'original') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'Japanese') utterance.lang = 'ja-JP';
    else if (lang === 'Korean') utterance.lang = 'ko-KR';
    else if (lang === 'Chinese') utterance.lang = 'zh-CN';
    else if (lang === 'English') utterance.lang = 'en-US';
    else if (lang === 'Arabic') utterance.lang = 'ar-SA';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = () => {
    onUpdateBubble({
      ...bubble,
      translatedText: editedText,
      isEdited: true
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-4 animate-in slide-in-from-bottom duration-200">
      <div className="bg-slate-900/95 border border-purple-500/40 rounded-3xl p-5 shadow-2xl shadow-black/80 backdrop-blur-md text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              فقاعة #{bubble.readingOrder} ({bubble.type})
            </span>
            <span className="text-xs text-slate-400">
              {sourceLang} إلى {targetLang}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Source original text */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
            <span className="font-semibold">النص الأصلي ({sourceLang}):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(bubble.originalText, sourceLang)}
                className="hover:text-purple-300 flex items-center gap-1 transition-colors"
                title="استماع للنطق الأصلي"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>نطق</span>
              </button>
              <button
                onClick={() => handleCopy(bubble.originalText, 'original')}
                className="hover:text-purple-300 flex items-center gap-1 transition-colors"
                title="نسخ الأصل"
              >
                {copiedType === 'original' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ</span>
              </button>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-200 font-['Noto_Sans_JP',_sans-serif] select-all">
            {bubble.originalText}
          </p>
        </div>

        {/* Translated Arabic Text */}
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-tr from-purple-950/40 to-slate-850 border border-purple-500/30">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-purple-300">
            <span className="font-bold font-['Cairo'] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" />
              الترجمة العربية المعدّلة للمانجا:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(bubble.translatedText, targetLang)}
                className="hover:text-purple-200 flex items-center gap-1 transition-colors"
                title="استماع للترجمة"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>استماع</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="hover:text-purple-200 flex items-center gap-1 transition-colors"
                title="تعديل الترجمة"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'إلغاء' : 'تعديل'}</span>
              </button>
              <button
                onClick={() => handleCopy(bubble.translatedText, 'translated')}
                className="hover:text-purple-200 flex items-center gap-1 transition-colors"
                title="نسخ الترجمة"
              >
                {copiedType === 'translated' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ</span>
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                dir="rtl"
                rows={2}
                className="w-full bg-slate-900 border border-purple-500/60 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-['Cairo']"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30"
                >
                  حفظ التعديل
                </button>
              </div>
            </div>
          ) : (
            <p className="text-base font-bold text-white font-['Changa'] leading-relaxed select-all" dir="rtl">
              {bubble.translatedText}
            </p>
          )}
        </div>

        {/* Action quick buttons */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onAddToGlossary(bubble.originalText, bubble.translatedText)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors font-['Cairo']"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span>إضافة للقاموس المخصص</span>
          </button>
          <span className="text-[11px] text-slate-400">
            الحجم: {bubble.box_2d ? `${Math.round(bubble.box_2d[2] - bubble.box_2d[0])}×${Math.round(bubble.box_2d[3] - bubble.box_2d[1])}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
