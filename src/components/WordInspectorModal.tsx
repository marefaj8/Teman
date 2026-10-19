import React, { useState } from 'react';
import { X, Search, Volume2, BookOpen, Sparkles, Copy, Check } from 'lucide-react';

interface WordInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLang: string;
  targetLang: string;
}

export const WordInspectorModal: React.FC<WordInspectorModalProps> = ({
  isOpen,
  onClose,
  sourceLang,
  targetLang,
}) => {
  if (!isOpen) return null;

  const [inputWord, setInputWord] = useState('');
  const [definition, setDefinition] = useState<{
    word: string;
    reading?: string;
    meanings: string[];
    example?: string;
    exampleTr?: string;
  } | null>({
    word: '仲間 (なかま - Nakama)',
    reading: 'na-ka-ma',
    meanings: ['رفيق، صديق مقرب كأنه فرد من العائلة', 'شريك، زميل في المغامرة'],
    example: 'オレたちは仲間だ！',
    exampleTr: 'نحن رفاق حتى النهاية!',
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLookup = async (wordToSearch: string) => {
    if (!wordToSearch.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/manga/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Define this manga word "${wordToSearch}" in Arabic with reading and short example: ${wordToSearch}`,
          sourceLang,
          targetLang,
          context: 'Manga and anime dictionary definition',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDefinition({
          word: wordToSearch,
          reading: 'قراءة وفحص المعجم',
          meanings: [data.translatedText],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (sourceLang === 'Japanese') utt.lang = 'ja-JP';
    else if (sourceLang === 'Korean') utt.lang = 'ko-KR';
    else if (sourceLang === 'Chinese') utt.lang = 'zh-CN';
    else utt.lang = 'en-US';
    window.speechSynthesis.speak(utt);
  };

  const sampleWords = [
    { word: '海賊王', read: 'Kaizoku-ō', ar: 'ملك القراصنة' },
    { word: '宿命', read: 'Shukumei', ar: 'القدر المحتوم' },
    { word: '그림자', read: 'Geurimja', ar: 'الظل / الأشباح' },
    { word: '修仙', read: 'Xiūxiān', ar: 'طريق الخلود الروحي' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base font-['Cairo']">
              فاحص ومعجم مفردات المانجا (Word Inspector)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup(inputWord)}
            placeholder={`اكتب كانجي أو كلمة بـ ${sourceLang}...`}
            className="flex-1 bg-slate-800/80 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none font-['Cairo']"
          />
          <button
            onClick={() => handleLookup(inputWord)}
            disabled={loading || !inputWord.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 font-['Cairo'] disabled:opacity-50"
          >
            {loading ? 'بحث...' : 'فحص'}
          </button>
        </div>

        {/* Quick chip suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap my-3">
          <span className="text-[11px] text-slate-400 font-['Cairo']">أمثلة سريعة:</span>
          {sampleWords.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputWord(item.word);
                handleLookup(item.word);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs border border-slate-700 font-mono transition-colors"
            >
              {item.word} ({item.ar})
            </button>
          ))}
        </div>

        {/* Result Card */}
        {definition && (
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-950/40 to-slate-850 border border-purple-500/30 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xl font-black text-white font-['Noto_Sans_JP',_sans-serif] flex items-center gap-2">
                  {definition.word}
                  <button
                    onClick={() => handleSpeak(definition.word)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                    title="نطق الكلمة"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </h4>
                {definition.reading && (
                  <p className="text-xs text-purple-300/80 font-['Noto_Sans_JP',_sans-serif] mt-0.5">
                    اللفظ الصوتي: {definition.reading}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-sm text-slate-200 font-['Cairo']" dir="rtl">
              <span className="text-xs font-bold text-slate-400 block mb-1">المعاني والسياق:</span>
              {definition.meanings.map((m, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>

            {definition.example && (
              <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs">
                <span className="text-slate-400 block mb-1">مثال من حوار مانجا:</span>
                <p className="font-mono text-purple-200">{definition.example}</p>
                {definition.exampleTr && (
                  <p className="text-slate-300 font-['Cairo'] mt-0.5" dir="rtl">
                    {definition.exampleTr}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
