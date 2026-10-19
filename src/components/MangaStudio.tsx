import React, { useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Eye,
  EyeOff,
  Edit3,
  Languages,
  Layers,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { MangaBubble, MangaPage, TranslationPreset } from '../types';
import { renderMangaPageToCanvas } from '../utils/canvasRenderer';

interface MangaStudioProps {
  currentPage: MangaPage;
  onUpdatePage: (updated: MangaPage) => void;
  preset: TranslationPreset;
  onDetectAndTranslate: (imageBase64: string) => Promise<MangaBubble[]>;
  isProcessing: boolean;
  onExportImage: () => void;
  onUploadImage: (file: File) => void;
}

export const MangaStudio: React.FC<MangaStudioProps> = ({
  currentPage,
  onUpdatePage,
  preset,
  onDetectAndTranslate,
  isProcessing,
  onExportImage,
  onUploadImage
}) => {
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'translated' | 'original' | 'split'>('translated');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Render canvas preview
  React.useEffect(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const render = () => {
      if (canvasRef.current && img.complete) {
        renderMangaPageToCanvas(
          canvasRef.current,
          img,
          previewMode === 'original' ? [] : currentPage.bubbles,
          preset,
          selectedBubbleId
        );
      }
    };
    if (img.complete) render();
    else img.onload = render;
  }, [currentPage, preset, previewMode, selectedBubbleId]);

  const handleUpdateBubbleText = (bubbleId: string, newText: string) => {
    const updated = currentPage.bubbles.map((b) =>
      b.id === bubbleId ? { ...b, translatedText: newText, isEdited: true } : b
    );
    onUpdatePage({ ...currentPage, bubbles: updated });
  };

  const handleDeleteBubble = (bubbleId: string) => {
    const filtered = currentPage.bubbles.filter((b) => b.id !== bubbleId);
    onUpdatePage({ ...currentPage, bubbles: filtered });
    if (selectedBubbleId === bubbleId) setSelectedBubbleId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 text-white">
      {/* Left/Main Column: Image / Canvas Visual Workspace */}
      <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md">
        {/* Studio top toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-['Cairo']">
                استوديو تعديل ومعالجة المانجا
              </h3>
              <p className="text-xs text-slate-400">
                فحص الفقاعات، المسح الضوئي، وتعديل الترجمة العربية يدوياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors font-['Cairo']"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>رفع صفحة مانجا جديدة</span>
            </button>

            <button
              onClick={onExportImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-colors font-['Cairo']"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الصورة المترجمة</span>
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 min-h-[450px] relative mt-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-auto p-2 custom-scrollbar">
          <img
            ref={imageRef}
            src={currentPage.imageUrl}
            alt={currentPage.title}
            className="hidden"
            crossOrigin="anonymous"
          />
          <div className="relative max-h-[70vh] flex items-center justify-center">
            <canvas ref={canvasRef} className="max-h-[70vh] object-contain rounded-xl block shadow-2xl" />

            {/* Interactive box selector */}
            {previewMode !== 'original' && (
              <div className="absolute inset-0 pointer-events-auto">
                {currentPage.bubbles.map((b) => {
                  const [ymin, xmin, ymax, xmax] = b.box_2d;
                  const isSelected = selectedBubbleId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBubbleId(b.id)}
                      style={{
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                      }}
                      className={`absolute cursor-pointer rounded-lg transition-all flex items-start justify-end p-1 ${
                        isSelected
                          ? 'border-2 border-purple-400 bg-purple-500/20 shadow-lg'
                          : 'border border-dashed border-purple-400/50 hover:bg-purple-500/10'
                      }`}
                    >
                      <span className="bg-slate-900/90 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        #{b.readingOrder}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Bubble List & Text Editor Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="font-bold text-sm font-['Cairo'] flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-pink-400" />
            قائمة الفقاعات ({currentPage.bubbles.length})
          </h4>
          <span className="text-[11px] text-purple-300 font-['Cairo'] bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
            {currentPage.language} إلى {currentPage.targetLang}
          </span>
        </div>

        {/* Bubbles List */}
        <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 custom-scrollbar max-h-[600px]">
          {currentPage.bubbles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-['Cairo']">
              لم يتم استخراج أي فقاعات بعد. اضغط على زر الترجمة بالذكاء الاصطناعي لفحص الصفحة.
            </div>
          ) : (
            currentPage.bubbles.map((b) => {
              const isSelected = selectedBubbleId === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBubbleId(b.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/30'
                      : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      <span>فقاعة #{b.readingOrder}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                        {b.type}
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBubble(b.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="حذف هذه الفقاعة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Original text */}
                  <p className="text-[11px] text-slate-300 font-['Noto_Sans_JP',_sans-serif] bg-slate-900/60 p-2 rounded-xl mb-2 line-clamp-2">
                    {b.originalText}
                  </p>

                  {/* Editable Translated text */}
                  <div className="mt-1">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 font-['Cairo']">
                      الترجمة العربية:
                    </label>
                    <textarea
                      value={b.translatedText}
                      onChange={(e) => handleUpdateBubbleText(b.id, e.target.value)}
                      dir="rtl"
                      rows={2}
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl p-2 text-xs text-white focus:outline-none font-['Changa']"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
