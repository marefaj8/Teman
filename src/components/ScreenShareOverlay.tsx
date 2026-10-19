import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Monitor,
  Play,
  Pause,
  Repeat,
  Sparkles,
  Camera,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Volume2
} from 'lucide-react';
import { MangaBubble, TranslationPreset } from '../types';
import { renderMangaPageToCanvas } from '../utils/canvasRenderer';

interface ScreenShareOverlayProps {
  preset: TranslationPreset;
  onDetectAndTranslate: (imageBase64: string) => Promise<MangaBubble[]>;
  isProcessing: boolean;
  onSelectBubble: (bubble: MangaBubble) => void;
  isAutoLoopActive: boolean;
  onToggleAutoLoop: () => void;
}

export const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = ({
  preset,
  onDetectAndTranslate,
  isProcessing,
  onSelectBubble,
  isAutoLoopActive,
  onToggleAutoLoop,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [bubbles, setBubbles] = useState<MangaBubble[]>([]);
  const [lastTranslatedTime, setLastTranslatedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<'overlay' | 'inpainted' | 'split'>('overlay');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start screen capture
  const startScreenCapture = async () => {
    try {
      setErrorMsg(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Handle stream end (user clicks browser "Stop sharing")
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenCapture();
      };
    } catch (err: any) {
      console.error('Error starting screen share:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'تم إلغاء إذن مشاركة الشاشة. يرجى اختيار النافذة أو التطبيق الذي يحتوي على المانجا.'
          : 'تعذر بدء مشاركة الشاشة. تأكد من دعم المتصفح لمشاركة الشاشة.'
      );
      setIsSharing(false);
    }
  };

  const stopScreenCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
    if (isAutoLoopActive) {
      onToggleAutoLoop();
    }
  };

  // Capture a snapshot frame from the video stream
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return null;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = videoRef.current.videoWidth;
    offCanvas.height = videoRef.current.videoHeight;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return offCanvas.toDataURL('image/jpeg', 0.88);
  }, []);

  // Run translation on current frame
  const translateCurrentScreen = useCallback(async () => {
    const frameBase64 = captureFrame();
    if (!frameBase64) return;

    try {
      const detected = await onDetectAndTranslate(frameBase64);
      setBubbles(detected);
      setLastTranslatedTime(new Date().toLocaleTimeString('ar-SA'));
    } catch (err: any) {
      console.error('Translation error on stream frame:', err);
    }
  }, [captureFrame, onDetectAndTranslate]);

  // Handle auto-loop interval
  useEffect(() => {
    if (isAutoLoopActive && isSharing) {
      loopTimerRef.current = setInterval(() => {
        if (!isProcessing) {
          translateCurrentScreen();
        }
      }, (preset.autoLoopIntervalSec || 3) * 1000);
    } else {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    }
    return () => {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, [isAutoLoopActive, isSharing, isProcessing, preset.autoLoopIntervalSec, translateCurrentScreen]);

  // Render bubbles on the canvas layer whenever video or bubbles update
  useEffect(() => {
    if (canvasRef.current && videoRef.current && isSharing) {
      renderMangaPageToCanvas(canvasRef.current, videoRef.current, bubbles, preset);
    }
  }, [bubbles, preset, isSharing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
      {/* Control bar when sharing */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-['Cairo'] flex items-center gap-2">
              وضع الترجمة فوق التطبيقات الأخرى (Screen Overlay)
              {isSharing && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  متصل ومباشر
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              {isSharing
                ? 'يعمل الآن فوق تطبيق المانجا أو المتصفح المحدد. الترجمة تظهر مباشرة فوق الفقاعات.'
                : 'حدد نافذة قارئ المانجا (أو المتصفح) لترجمة الصفحات فورياً فوق التطبيق.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isSharing ? (
            <button
              onClick={startScreenCapture}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all font-['Cairo']"
            >
              <Monitor className="w-4 h-4" />
              <span>اختيار التطبيق / مشاركة الشاشة</span>
            </button>
          ) : (
            <>
              {/* Scan now button */}
              <button
                onClick={translateCurrentScreen}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors font-['Cairo'] shadow disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'جارِ الترجمة...' : 'ترجمة الشاشة الآن'}</span>
              </button>

              {/* Auto Loop Toggle */}
              <button
                onClick={onToggleAutoLoop}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors font-['Cairo'] ${
                  isAutoLoopActive
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Repeat className={`w-3.5 h-3.5 ${isAutoLoopActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <span>{isAutoLoopActive ? 'المراقبة المستمرة نشطة' : 'تفعيل المراقبة التلقائية'}</span>
              </button>

              {/* Stop stream */}
              <button
                onClick={stopScreenCapture}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs font-bold transition-colors font-['Cairo']"
              >
                إيقاف المشاركة
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="w-full max-w-4xl bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 mb-3 text-rose-300 text-xs flex items-center gap-2 font-['Cairo']">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Screen Area Container */}
      <div className="relative w-full max-w-5xl aspect-video bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
        {!isSharing ? (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-3xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-inner">
              <Monitor className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Cairo']">
              ترجمة المانجا فوق التطبيقات الأخرى
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 font-['Cairo']">
              اضغط على الزر أدناه لاختيار أي تطبيق مانجا يعمل على جهازك (مثل قارئ المانجا، متصفح الويب، أو قارئ ملفات PDF).
              سيظهر زر <strong className="text-purple-400">MangaLingo</strong> العائم ليقوم بفحص وقراءة وترجمة الفقاعات في الحال.
            </p>
            <button
              onClick={startScreenCapture}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all font-['Cairo']"
            >
              بدء الترجمة فوق تطبيق آخر
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Live mirrored video from external application */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            {/* Canvas overlay with speech bubble inpainting and Arabic lettering */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Clickable interactive speech balloons for each bubble */}
            <div className="absolute inset-0 pointer-events-auto">
              {bubbles.map((b) => {
                const [ymin, xmin, ymax, xmax] = b.box_2d;
                const isSfx = b.type === 'sfx';
                const bgColor = b.backgroundColor || (isSfx ? '#000000' : '#ffffff');
                const textColor = b.textColor || (bgColor === '#000000' ? '#ffffff' : '#0f172a');

                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBubble(b)}
                    style={{
                      top: `${ymin / 10}%`,
                      left: `${xmin / 10}%`,
                      width: `${(xmax - xmin) / 10}%`,
                      height: `${(ymax - ymin) / 10}%`,
                      backgroundColor: preset.eraseOriginalText ? bgColor : 'transparent',
                      opacity: preset.eraseOriginalText ? preset.bubbleOpacity : 1,
                      borderColor: isSfx ? '#ef4444' : 'rgba(0,0,0,0.5)',
                    }}
                    className="absolute cursor-pointer rounded-2xl p-1.5 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-md border hover:scale-101 hover:shadow-lg z-10"
                    title="انقر لفحص وتعديل أو سماع هذه الفقاعة"
                  >
                    <span
                      dir="rtl"
                      style={{
                        fontFamily: `${preset.fontFamily}, Cairo, Tajawal, sans-serif`,
                        color: textColor,
                        fontSize: `clamp(11px, ${13 * preset.fontSizeScale}px, 24px)`,
                        lineHeight: 1.2,
                      }}
                      className={`font-bold select-none ${
                        isSfx
                          ? 'font-black tracking-wider text-rose-500 [text-shadow:_0_1px_3px_rgba(255,255,255,0.8)]'
                          : 'drop-shadow-xs'
                      }`}
                    >
                      {b.translatedText}
                    </span>
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-900 border border-purple-500/60 text-purple-300 text-[8px] font-black flex items-center justify-center shadow">
                      {b.readingOrder}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stats badge on the bottom left */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-white">
              <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                {bubbles.length} فقاعات مترجمة
              </span>
              {lastTranslatedTime && (
                <span className="text-[11px] text-slate-400 border-r border-slate-700 pr-2">
                  آخر تحديث: {lastTranslatedTime}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
