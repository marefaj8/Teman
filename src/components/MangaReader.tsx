import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Volume2,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { MangaBubble, MangaPage, TranslationPreset } from '../types';
import { renderMangaPageToCanvas } from '../utils/canvasRenderer';

interface MangaReaderProps {
  currentPage: MangaPage;
  totalPages: number;
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  preset: TranslationPreset;
  onSelectBubble: (bubble: MangaBubble) => void;
  selectedBubbleId?: string | null;
  onExportImage: () => void;
  isProcessing: boolean;
  onTriggerScan: () => void;
}

export const MangaReader: React.FC<MangaReaderProps> = ({
  currentPage,
  totalPages,
  currentPageIndex,
  onPageChange,
  preset,
  onSelectBubble,
  selectedBubbleId,
  onExportImage,
  isProcessing,
  onTriggerScan,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 select-none">
      {/* Top Reader Toolbar */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 mb-2 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md text-white">
        {/* Title and stats */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-xs sm:text-sm font-['Cairo'] text-white">
            {currentPage.title}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            صفحة {currentPageIndex + 1} من {totalPages}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick AI Scan page */}
          <button
            onClick={onTriggerScan}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all font-['Cairo'] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'جارِ الترجمة...' : 'ترجمة بالذكاء الاصطناعي'}</span>
          </button>

          {/* Toggle original vs translated */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors font-['Cairo'] ${
              showOriginal ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="تبديل عرض المانجا الأصلية أو المترجمة"
          >
            {showOriginal ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showOriginal ? 'الأصل' : 'الترجمة'}</span>
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Export Translated Image */}
          <button
            onClick={onExportImage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-colors font-['Cairo']"
            title="تحميل الصفحة مدمجة باللغة العربية"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحميل الصفحة</span>
          </button>
        </div>
      </div>

      {/* Main Manga Viewport */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-auto p-1 custom-scrollbar">
        {/* Zoomable Container */}
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="relative max-w-full max-h-[82vh] transition-transform duration-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center"
        >
          {/* Base Manga Page Image */}
          <img
            ref={imageRef}
            src={currentPage.imageUrl}
            alt={currentPage.title}
            className="max-w-full max-h-[80vh] object-contain block pointer-events-none"
            crossOrigin="anonymous"
          />

          {/* Interactive Speech Bubble Inpainting & Typography Overlay */}
          {!showOriginal && (
            <div className="absolute inset-0 pointer-events-auto">
              {currentPage.bubbles.map((bubble) => {
                const [ymin, xmin, ymax, xmax] = bubble.box_2d;
                const isSelected = selectedBubbleId === bubble.id;
                const isSfx = bubble.type === 'sfx';

                // Background styling based on preset & bubble type
                const bgColor = bubble.backgroundColor || (isSfx ? '#000000' : '#ffffff');
                const textColor = bubble.textColor || (bgColor === '#000000' ? '#ffffff' : '#0f172a');

                return (
                  <div
                    key={bubble.id}
                    onClick={() => onSelectBubble(bubble)}
                    style={{
                      top: `${ymin / 10}%`,
                      left: `${xmin / 10}%`,
                      width: `${(xmax - xmin) / 10}%`,
                      height: `${(ymax - ymin) / 10}%`,
                      backgroundColor: preset.eraseOriginalText ? bgColor : 'transparent',
                      opacity: preset.eraseOriginalText ? preset.bubbleOpacity : 1,
                      borderColor: isSelected
                        ? '#a855f7'
                        : isSfx
                        ? '#ef4444'
                        : preset.eraseOriginalText
                        ? 'rgba(0,0,0,0.5)'
                        : 'rgba(168,85,247,0.4)',
                    }}
                    className={`absolute cursor-pointer rounded-2xl p-1.5 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-md ${
                      isSelected
                        ? 'ring-2 ring-purple-400 shadow-purple-500/40 z-20 scale-102'
                        : 'border hover:scale-101 hover:shadow-lg z-10'
                    }`}
                  >
                    {/* Translated Arabic text with rich comic lettering */}
                    <span
                      dir="rtl"
                      style={{
                        fontFamily: `${preset.fontFamily}, Cairo, Tajawal, sans-serif`,
                        color: textColor,
                        fontSize: `clamp(11px, ${14 * preset.fontSizeScale}px, 26px)`,
                        lineHeight: 1.25,
                      }}
                      className={`font-bold select-none ${
                        isSfx
                          ? 'font-black tracking-wider text-rose-500 [text-shadow:_0_1px_4px_rgba(255,255,255,0.8)]'
                          : 'drop-shadow-xs'
                      }`}
                    >
                      {bubble.translatedText}
                    </span>

                    {/* Badge showing reading order */}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-purple-500/60 text-purple-300 text-[9px] font-black flex items-center justify-center shadow">
                      {bubble.readingOrder}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Page Navigation Bar */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 mt-2 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md text-white font-['Cairo']">
        <button
          onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>السابق</span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onPageChange(idx)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                idx === currentPageIndex
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition-colors"
        >
          <span>التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
