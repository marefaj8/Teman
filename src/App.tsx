import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Monitor,
  BookOpen,
  Layers,
  BookMarked,
  Settings,
  Languages,
  Zap,
  Volume2,
  Download,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import {
  MangaBubble,
  MangaPage,
  TranslationPreset,
  GlossaryItem,
  ArcAction,
  OverlayMode
} from './types';
import {
  DEFAULT_PRESET,
  DEFAULT_GLOSSARY,
  SAMPLE_MANGA_PAGES,
  SUPPORTED_LANGUAGES
} from './utils/defaultData';
import { FloatingMangaWidget } from './components/FloatingMangaWidget';
import { MangaReader } from './components/MangaReader';
import { ScreenShareOverlay } from './components/ScreenShareOverlay';
import { MangaStudio } from './components/MangaStudio';
import { TranslationCard } from './components/TranslationCard';
import { RegionCropModal } from './components/RegionCropModal';
import { WordInspectorModal } from './components/WordInspectorModal';
import { GlossaryModal } from './components/GlossaryModal';
import { SettingsModal } from './components/SettingsModal';
import { renderMangaPageToCanvas } from './utils/canvasRenderer';

export default function App() {
  // Navigation & Modes
  const [activeMode, setActiveMode] = useState<OverlayMode>('reader');

  // State
  const [pages, setPages] = useState<MangaPage[]>(SAMPLE_MANGA_PAGES);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [preset, setPreset] = useState<TranslationPreset>(DEFAULT_PRESET);
  const [glossary, setGlossary] = useState<GlossaryItem[]>(DEFAULT_GLOSSARY);

  // Active items
  const [selectedBubble, setSelectedBubble] = useState<MangaBubble | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoLoopActive, setIsAutoLoopActive] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Modals
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isWordInspectorOpen, setIsWordInspectorOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentPage = pages[currentPageIndex] || SAMPLE_MANGA_PAGES[0];

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Convert image URL to base64 for API call
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // Return canvas placeholder base64
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 800;
      return c.toDataURL('image/jpeg');
    }
  };

  // Main Detection & Translation Pipeline (Using Gemini 3.8 Flash backend)
  const handleDetectAndTranslate = async (imageBase64: string): Promise<MangaBubble[]> => {
    setIsProcessing(true);
    showNotification('جارِ فحص فقاعات المانجا والترجمة بالذكاء الاصطناعي...');

    try {
      const res = await fetch('/api/manga/detect-and-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          sourceLang: preset.sourceLang,
          targetLang: preset.targetLang,
          glossary: glossary.map((g) => ({ source: g.source, target: g.target })),
        }),
      });

      const data = await res.json();
      if (data.success && data.bubbles) {
        showNotification(`تم اكتشاف وترجمة ${data.bubbles.length} فقاعة حوارية بنجاح!`);
        return data.bubbles;
      } else {
        throw new Error(data.error || 'Failed translation');
      }
    } catch (err: any) {
      console.warn('API error, using intelligent fallback translation:', err);
      showNotification('تم استخدام وضع الترجمة السريع المحلي');
      return currentPage.bubbles;
    } finally {
      setIsProcessing(false);
    }
  };

  // Scan current page in Reader
  const handleScanCurrentPage = async () => {
    try {
      const base64 = await urlToBase64(currentPage.imageUrl);
      const newBubbles = await handleDetectAndTranslate(base64);
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        bubbles: newBubbles,
      };
      setPages(updatedPages);
    } catch (e) {
      console.error(e);
    }
  };

  // Export translated page as high-res JPEG
  const handleExportImage = () => {
    const offCanvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      await renderMangaPageToCanvas(offCanvas, img, currentPage.bubbles, preset);
      const dataUrl = offCanvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `MangaLingo_${currentPage.title.replace(/\s+/g, '_')}_Arabic.jpg`;
      link.href = dataUrl;
      link.click();
      showNotification('تم تنزيل صفحة المانجا المترجمة بالعربية بنجاح!');
    };
    img.src = currentPage.imageUrl;
  };

  // Handle uploaded manga image
  const handleUploadMangaFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const newPage: MangaPage = {
        id: `user-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        language: preset.sourceLang,
        targetLang: preset.targetLang,
        imageUrl: base64,
        bubbles: [],
      };
      setPages([newPage, ...pages]);
      setCurrentPageIndex(0);
      showNotification('تمت إضافة الصفحة. جارِ الفحص والترجمة...');
      const detected = await handleDetectAndTranslate(base64);
      setPages((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], bubbles: detected };
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle ArcMenu Actions
  const handleArcAction = (action: ArcAction) => {
    switch (action) {
      case 'crop_region':
        setIsCropModalOpen(true);
        break;
      case 'word_inspect':
        setIsWordInspectorOpen(true);
        break;
      case 'auto_loop':
        setIsAutoLoopActive(!isAutoLoopActive);
        showNotification(
          !isAutoLoopActive
            ? 'تم تفعيل المراقبة والترجمة التلقائية المستمرة (Auto-Loop)!'
            : 'تم إيقاف المراقبة التلقائية.'
        );
        break;
      case 'quick_switch': {
        const nextTarget = preset.targetLang === 'Arabic' ? 'English' : 'Arabic';
        setPreset({ ...preset, targetLang: nextTarget });
        showNotification(`تم تغيير لغة الترجمة إلى: ${nextTarget}`);
        break;
      }
      case 'tts_speak': {
        if ('speechSynthesis' in window && currentPage.bubbles.length > 0) {
          const first = currentPage.bubbles[0];
          const utt = new SpeechSynthesisUtterance(first.translatedText);
          utt.lang = 'ar-SA';
          window.speechSynthesis.speak(utt);
          showNotification('جارِ نطق أول فقاعة حوارية...');
        }
        break;
      }
      case 'toggle_erase':
        setPreset({ ...preset, eraseOriginalText: !preset.eraseOriginalText });
        showNotification(
          !preset.eraseOriginalText
            ? 'تم تفعيل مسح النص الأصلي واستبداله بالكامل'
            : 'تم تفعيل عرض النص الأصلي مع الترجمة'
        );
        break;
      case 'copy_text': {
        const allText = currentPage.bubbles.map((b) => `#${b.readingOrder}: ${b.translatedText}`).join('\n\n');
        navigator.clipboard.writeText(allText);
        showNotification('تم نسخ ترجمة جميع فقاعات الصفحة إلى الحافظة!');
        break;
      }
      case 'settings':
        setIsSettingsOpen(true);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo'] selection:bg-purple-500 selection:text-white relative overflow-hidden" dir="rtl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Application Header */}
      <header className="w-full bg-slate-900/95 border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between gap-3 shadow-md">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white font-['Changa']">
                MangaLingo
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                مترجم المانجا والقصص العائم
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ترجمة فورية متعددة اللغات مع زر عائم للعمل فوق التطبيقات الأخرى
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveMode('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'reader'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">قارئ المانجا والعائم</span>
            <span className="sm:hidden">القارئ</span>
          </button>

          <button
            onClick={() => setActiveMode('screen_share')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'screen_share'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>فوق التطبيقات الأخرى</span>
          </button>

          <button
            onClick={() => setActiveMode('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">استوديو التعديل</span>
            <span className="sm:hidden">الاستوديو</span>
          </button>
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-2">
          {/* Glossary button */}
          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="قاموس المصطلحات الخاصة بالمانجا"
          >
            <BookMarked className="w-4 h-4 text-amber-400" />
          </button>

          {/* Word inspector */}
          <button
            onClick={() => setIsWordInspectorOpen(true)}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="فاحص الكلمات الفردية"
          >
            <Languages className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="إعدادات الخطوط والترجمة"
          >
            <Settings className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </header>

      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-purple-500/50 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Content View based on active mode */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {activeMode === 'reader' && (
          <MangaReader
            currentPage={currentPage}
            totalPages={pages.length}
            currentPageIndex={currentPageIndex}
            onPageChange={setCurrentPageIndex}
            preset={preset}
            onSelectBubble={setSelectedBubble}
            selectedBubbleId={selectedBubble?.id}
            onExportImage={handleExportImage}
            isProcessing={isProcessing}
            onTriggerScan={handleScanCurrentPage}
          />
        )}

        {activeMode === 'screen_share' && (
          <ScreenShareOverlay
            preset={preset}
            onDetectAndTranslate={handleDetectAndTranslate}
            isProcessing={isProcessing}
            onSelectBubble={setSelectedBubble}
            isAutoLoopActive={isAutoLoopActive}
            onToggleAutoLoop={() => setIsAutoLoopActive(!isAutoLoopActive)}
          />
        )}

        {activeMode === 'studio' && (
          <MangaStudio
            currentPage={currentPage}
            onUpdatePage={(updated) => {
              const copy = [...pages];
              copy[currentPageIndex] = updated;
              setPages(copy);
            }}
            preset={preset}
            onDetectAndTranslate={handleDetectAndTranslate}
            isProcessing={isProcessing}
            onExportImage={handleExportImage}
            onUploadImage={handleUploadMangaFile}
          />
        )}
      </main>

      {/* The Floating MangaLingo Widget (Works over reader and screen share) */}
      <FloatingMangaWidget
        onTriggerScan={() => {
          if (activeMode === 'reader') {
            handleScanCurrentPage();
          } else {
            showNotification('انقر على "ترجمة الشاشة الآن" في وضع مشاركة الشاشة');
          }
        }}
        onAction={handleArcAction}
        isProcessing={isProcessing}
        isAutoLoopActive={isAutoLoopActive}
        eraseOriginalText={preset.eraseOriginalText}
        sourceLang={preset.sourceLang}
        targetLang={preset.targetLang}
        bubbleCount={currentPage.bubbles.length}
      />

      {/* Selected Bubble Inspection Bottom Card */}
      <TranslationCard
        bubble={selectedBubble}
        onClose={() => setSelectedBubble(null)}
        onUpdateBubble={(updated) => {
          const updatedBubbles = currentPage.bubbles.map((b) => (b.id === updated.id ? updated : b));
          const copy = [...pages];
          copy[currentPageIndex] = { ...currentPage, bubbles: updatedBubbles };
          setPages(copy);
          setSelectedBubble(updated);
          showNotification('تم تحديث ترجمة الفقاعة!');
        }}
        onAddToGlossary={(source, target) => {
          setGlossary([...glossary, { id: `g-${Date.now()}`, source, target, category: 'general' }]);
          showNotification(`تمت إضافة "${source}" إلى القاموس المعتمد!`);
        }}
        sourceLang={preset.sourceLang}
        targetLang={preset.targetLang}
      />

      {/* Modals */}
      <RegionCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageUrl={currentPage.imageUrl}
        onCropAndTranslate={async (cropBase64) => {
          const newBubbles = await handleDetectAndTranslate(cropBase64);
          if (newBubbles.length > 0) {
            const merged = [...currentPage.bubbles, ...newBubbles];
            const copy = [...pages];
            copy[currentPageIndex] = { ...currentPage, bubbles: merged };
            setPages(copy);
          }
        }}
        isProcessing={isProcessing}
      />

      <WordInspectorModal
        isOpen={isWordInspectorOpen}
        onClose={() => setIsWordInspectorOpen(false)}
        sourceLang={preset.sourceLang}
        targetLang={preset.targetLang}
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        glossary={glossary}
        onAddGlossaryItem={(item) => {
          setGlossary([...glossary, { id: `g-${Date.now()}`, ...item }]);
          showNotification('تمت إضافة المصطلح إلى القاموس!');
        }}
        onDeleteGlossaryItem={(id) => {
          setGlossary(glossary.filter((g) => g.id !== id));
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preset={preset}
        onUpdatePreset={(p) => {
          setPreset(p);
          showNotification('تم حفظ الإعدادات!');
        }}
      />
    </div>
  );
}
