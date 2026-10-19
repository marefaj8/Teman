import React, { useState, useRef } from 'react';
import { X, Crop, Sparkles, Check } from 'lucide-react';

interface RegionCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropAndTranslate: (cropBase64: string) => Promise<void>;
  isProcessing: boolean;
}

export const RegionCropModal: React.FC<RegionCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropAndTranslate,
  isProcessing
}) => {
  if (!isOpen) return null;

  const [box, setBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBox({ startX: x, startY: y, endX: x, endY: y });
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !containerRef.current || !box) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setBox({ ...box, endX: x, endY: y });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleConfirmCrop = async () => {
    if (!box || !imgRef.current) return;
    const img = imgRef.current;

    const xMin = Math.min(box.startX, box.endX);
    const xMax = Math.max(box.startX, box.endX);
    const yMin = Math.min(box.startY, box.endY);
    const yMax = Math.max(box.startY, box.endY);

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const cropX = (xMin / 100) * naturalWidth;
    const cropY = (yMin / 100) * naturalHeight;
    const cropW = ((xMax - xMin) / 100) * naturalWidth;
    const cropH = ((yMax - yMin) / 100) * naturalHeight;

    if (cropW < 10 || cropH < 10) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cropW;
    offCanvas.height = cropH;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const cropBase64 = offCanvas.toDataURL('image/jpeg', 0.9);

    await onCropAndTranslate(cropBase64);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-3xl p-5 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base font-['Cairo']">
              تحديد واقتصاص منطقة للترجمة الفورية
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 my-2 font-['Cairo']">
          اسحب مؤشر الفأرة أو إصبعك لرسم مستطيل حول فقاعة الكلام أو النص الذي ترغب في ترجمته تحديداً.
        </p>

        {/* Interactive Image Box */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative max-h-[60vh] overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center cursor-crosshair select-none my-3"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop Target"
            className="max-h-[60vh] object-contain pointer-events-none"
            crossOrigin="anonymous"
          />

          {box && (
            <div
              style={{
                top: `${Math.min(box.startY, box.endY)}%`,
                left: `${Math.min(box.startX, box.endX)}%`,
                width: `${Math.abs(box.endX - box.startX)}%`,
                height: `${Math.abs(box.endY - box.startY)}%`,
              }}
              className="absolute border-2 border-purple-400 bg-purple-500/25 rounded shadow-lg pointer-events-none"
            />
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setBox(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 font-['Cairo']"
          >
            إعادة التعيين
          </button>
          <button
            onClick={handleConfirmCrop}
            disabled={!box || isProcessing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 font-['Cairo'] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'جارِ الترجمة...' : 'ترجمة المنطقة المحددة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
