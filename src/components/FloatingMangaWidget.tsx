import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Languages, Repeat } from 'lucide-react';
import { ArcAction } from '../types';
import { ArcMenu } from './ArcMenu';

interface FloatingMangaWidgetProps {
  onTriggerScan: () => void;
  onAction: (action: ArcAction) => void;
  isProcessing: boolean;
  isAutoLoopActive: boolean;
  eraseOriginalText: boolean;
  sourceLang: string;
  targetLang: string;
  bubbleCount: number;
}

export const FloatingMangaWidget: React.FC<FloatingMangaWidgetProps> = ({
  onTriggerScan,
  onAction,
  isProcessing,
  isAutoLoopActive,
  eraseOriginalText,
  sourceLang,
  targetLang,
  bubbleCount
}) => {
  const [position, setPosition] = useState({ x: 24, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 70, dragStartRef.current.posX + dx));
    const newY = Math.max(20, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // If wasn't dragged, consider it a click!
    if (!hasMovedRef.current) {
      setIsMenuOpen(true);
    } else {
      // Snap to nearest screen edge (left or right)
      const snapToRight = position.x > window.innerWidth / 2;
      setPosition((prev) => ({
        x: snapToRight ? window.innerWidth - 75 : 16,
        y: prev.y
      }));
    }
  };

  return (
    <>
      {/* The Floating Draggable Liquid Widget */}
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`fixed top-0 left-0 z-40 select-none cursor-grab active:cursor-grabbing transition-transform ${
          isDragging ? 'duration-0' : 'duration-300'
        }`}
      >
        <div className="relative group">
          {/* Active loop pulse ring */}
          {isAutoLoopActive && (
            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
          )}

          {/* Processing glow */}
          {isProcessing && (
            <div className="absolute -inset-2 rounded-full bg-purple-500/40 animate-pulse blur-sm pointer-events-none" />
          )}

          {/* Main button */}
          <div
            className={`w-14 h-14 rounded-2xl p-0.5 shadow-xl shadow-purple-950/50 flex items-center justify-center transition-all duration-200 ${
              isProcessing
                ? 'bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 scale-105'
                : isAutoLoopActive
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 hover:scale-105'
            }`}
          >
            <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex flex-col items-center justify-center text-white relative">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              ) : isAutoLoopActive ? (
                <Repeat className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              ) : (
                <Sparkles className="w-6 h-6 text-purple-300 group-hover:text-pink-300 transition-colors" />
              )}
              <span className="text-[9px] font-black tracking-tighter mt-0.5 text-purple-200">
                {sourceLang.slice(0, 2).toUpperCase()} → AR
              </span>

              {/* Bubble count badge */}
              {bubbleCount > 0 && !isProcessing && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-pink-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-slate-900 shadow">
                  {bubbleCount}
                </span>
              )}
            </div>
          </div>

          {/* Hover helper badge */}
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900/95 text-slate-200 border border-slate-700 text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl font-['Cairo']">
            انقر لفتح أدوات الترجمة العائمة
          </div>
        </div>
      </div>

      {/* The Arc Menu Modal */}
      <ArcMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onAction={(action) => {
          if (action === 'translate_screen') {
            onTriggerScan();
          } else {
            onAction(action);
          }
        }}
        isAutoLoopActive={isAutoLoopActive}
        eraseOriginalText={eraseOriginalText}
        isProcessing={isProcessing}
        sourceLang={sourceLang}
        targetLang={targetLang}
      />
    </>
  );
};
