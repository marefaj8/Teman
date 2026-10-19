export interface MangaBubble {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 range
  originalText: string;
  translatedText: string;
  readingOrder: number;
  type: 'dialogue' | 'thought' | 'narration' | 'sfx';
  direction?: 'vertical' | 'horizontal';
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  isEdited?: boolean;
}

export interface MangaPage {
  id: string;
  title: string;
  language: string;
  targetLang: string;
  imageUrl: string;
  bubbles: MangaBubble[];
}

export interface GlossaryItem {
  id: string;
  source: string;
  target: string;
  category?: 'character' | 'attack' | 'honorific' | 'place' | 'general';
  notes?: string;
}

export interface TranslationPreset {
  name: string;
  sourceLang: string;
  targetLang: string;
  fontFamily: 'Changa' | 'Cairo' | 'Tajawal' | 'Amiri' | 'sans-serif';
  fontSizeScale: number; // 0.8 to 1.5
  eraseOriginalText: boolean;
  bubbleOpacity: number; // 0 to 1
  autoLoopIntervalSec: number;
  speechPitch: number;
  speechRate: number;
  voiceGender: 'female' | 'male' | 'natural';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  imageUrl: string;
  sourceLang: string;
  targetLang: string;
  bubbleCount: number;
  bubbles: MangaBubble[];
}

export type OverlayMode = 'screen_share' | 'reader' | 'studio';

export type ArcAction =
  | 'translate_screen'
  | 'crop_region'
  | 'word_inspect'
  | 'auto_loop'
  | 'quick_switch'
  | 'tts_speak'
  | 'toggle_erase'
  | 'copy_text'
  | 'settings';
