import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Sample manga mock data if offline or if no image uploaded
const SAMPLE_PAGES = [
  {
    id: 'sample-jp-1',
    title: 'One Piece - Chapter 1090 (Shonen Sample)',
    language: 'Japanese',
    targetLang: 'Arabic',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    bubbles: [
      {
        id: 'b-1',
        box_2d: [120, 580, 260, 850], // [ymin, xmin, ymax, xmax] in 1000 scale
        originalText: '海賊王に俺はなる！！！',
        translatedText: 'سأصبح ملك القراصنة بلا ريب!',
        readingOrder: 1,
        type: 'dialogue',
        direction: 'vertical'
      },
      {
        id: 'b-2',
        box_2d: [310, 150, 440, 420],
        originalText: '待ってくれ、ルフィ！敵の数が多すぎる！',
        translatedText: 'انتظر يا لوفي! عدد الأعداء كبير جداً!',
        readingOrder: 2,
        type: 'dialogue',
        direction: 'vertical'
      },
      {
        id: 'b-3',
        box_2d: [520, 600, 680, 880],
        originalText: '大丈夫だ…仲間を信じているからな！',
        translatedText: 'لا بأس… لأني أثق برفاقي تماماً!',
        readingOrder: 3,
        type: 'thought',
        direction: 'vertical'
      },
      {
        id: 'b-4',
        box_2d: [750, 220, 880, 450],
        originalText: 'ドンッ！！',
        translatedText: '*دووووم!!*',
        readingOrder: 4,
        type: 'sfx',
        direction: 'vertical'
      }
    ]
  },
  {
    id: 'sample-kr-1',
    title: 'Solo Leveling (Webtoon Sample)',
    language: 'Korean',
    targetLang: 'Arabic',
    imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=1200&q=80',
    bubbles: [
      {
        id: 'b-kr-1',
        box_2d: [80, 200, 220, 600],
        originalText: '일어나라... 나의 그림자 군단이여.',
        translatedText: 'انهضوا... يا فيلق ظلالي.',
        readingOrder: 1,
        type: 'dialogue',
        direction: 'horizontal'
      },
      {
        id: 'b-kr-2',
        box_2d: [350, 450, 490, 850],
        originalText: '시스템: 플레이어의 레벨이 상승했습니다.',
        translatedText: 'النظام: لقد ارتفع مستوى اللاعب.',
        readingOrder: 2,
        type: 'narration',
        direction: 'horizontal'
      },
      {
        id: 'b-kr-3',
        box_2d: [620, 150, 780, 500],
        originalText: '이 힘은 대체 어디서 온 것인가?',
        translatedText: 'من أين جاءت هذه القوة الهائلة يا تُرى؟',
        readingOrder: 3,
        type: 'thought',
        direction: 'horizontal'
      }
    ]
  },
  {
    id: 'sample-en-1',
    title: 'Cyberpunk Comic (English Sample)',
    language: 'English',
    targetLang: 'Arabic',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    bubbles: [
      {
        id: 'b-en-1',
        box_2d: [110, 150, 240, 520],
        originalText: 'The network has been compromised! Jack in now!',
        translatedText: 'تم اختراق الشبكة بالكامل! اتصل بالنظام فوراً!',
        readingOrder: 1,
        type: 'dialogue',
        direction: 'horizontal'
      },
      {
        id: 'b-en-2',
        box_2d: [330, 520, 480, 890],
        originalText: 'Hold your fire! She is our only lead left in Neo-Tokyo.',
        translatedText: 'أوقفوا إطلاق النار! إنها خيطنا الوحيد المتبقي في نيو طوكيو.',
        readingOrder: 2,
        type: 'dialogue',
        direction: 'horizontal'
      },
      {
        id: 'b-en-3',
        box_2d: [680, 250, 810, 650],
        originalText: 'BZZZZT! OVERHEAT DETECTED.',
        translatedText: '*بزززت! تحذير: ارتفاع مفرط في درجة الحرارة.*',
        readingOrder: 3,
        type: 'sfx',
        direction: 'horizontal'
      }
    ]
  }
];

// Endpoint: Get Sample Pages
app.get('/api/manga/samples', (_req, res) => {
  res.json({ success: true, samples: SAMPLE_PAGES });
});

// Endpoint: Detect Bubbles & Translate with Gemini Vision
app.post('/api/manga/detect-and-translate', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', sourceLang = 'Japanese', targetLang = 'Arabic', glossary = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    if (!ai) {
      // Fallback if no API key configured
      return res.json({
        success: true,
        sourceLang,
        targetLang,
        isFallback: true,
        bubbles: [
          {
            id: 'mock-1',
            box_2d: [150, 450, 320, 820],
            originalText: '何だこの力は…！？',
            translatedText: 'ما هذه القوة الغريبة...؟! (ترجمة محلية تجريبية)',
            readingOrder: 1,
            type: 'dialogue',
            backgroundColor: '#ffffff'
          },
          {
            id: 'mock-2',
            box_2d: [400, 180, 560, 550],
            originalText: '逃げろ！早く！',
            translatedText: 'اهربوا! بسرعة!',
            readingOrder: 2,
            type: 'dialogue',
            backgroundColor: '#ffffff'
          }
        ]
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const glossaryInstruction = Array.isArray(glossary) && glossary.length > 0
      ? `\nMandatory Glossary Term Mapping: ${glossary.map((g: any) => `${g.source} -> ${g.target}`).join(', ')}`
      : '';

    const prompt = `You are the world's most capable manga, comic, and webtoon translation engine (like MangaLingo).
Analyze this manga/comic page image and extract every speech bubble, thought balloon, narration box, and sound effect (SFX).

TASK:
1. Detect all text regions and speech bubbles.
2. For each bubble, output its 2D bounding box normalized to 0-1000 scale [ymin, xmin, ymax, xmax].
3. Extract the exact OCR transcript in the source language (${sourceLang}).
4. Translate each text into natural, expressive ${targetLang} (with special attention to authentic manga/comic localization and tone).
5. Determine the reading order (for Japanese manga, right-to-left, top-to-bottom).
6. Classify type: "dialogue", "thought", "narration", or "sfx".
7. Detect the approximate background color of the bubble interior (e.g., "#ffffff", "#000000", "#f5f5f5") so we can cleanly inpaint/mask it.

${glossaryInstruction}

Return ONLY a valid JSON object matching this schema:
{
  "detectedSourceLang": "${sourceLang}",
  "bubbles": [
    {
      "id": "b-1",
      "box_2d": [ymin, xmin, ymax, xmax],
      "originalText": "...",
      "translatedText": "...",
      "readingOrder": 1,
      "type": "dialogue",
      "direction": "vertical",
      "backgroundColor": "#ffffff"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean possible markdown backticks
      const sanitized = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(sanitized);
    }

    res.json({
      success: true,
      bubbles: parsedData.bubbles || [],
      detectedSourceLang: parsedData.detectedSourceLang || sourceLang,
      targetLang,
    });
  } catch (error: any) {
    console.error('Error in /api/manga/detect-and-translate:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to detect and translate manga page',
    });
  }
});

// Endpoint: Quick Single Text Translation
app.post('/api/manga/translate-text', async (req, res) => {
  try {
    const { text, sourceLang = 'Japanese', targetLang = 'Arabic', context = 'Manga speech bubble' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    if (!ai) {
      return res.json({
        success: true,
        translatedText: `[ترجمة]: ${text}`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Translate the following manga dialogue from ${sourceLang} to ${targetLang}. 
Context: ${context}. Make it natural, expressive, suitable for comic speech balloons without extra fluff or explanations.
Text: ${text}`,
      config: {
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      translatedText: (response.text || '').trim(),
    });
  } catch (error: any) {
    console.error('Error translating text:', error);
    res.status(500).json({ success: false, error: error?.message || 'Translation failed' });
  }
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MangaLingo server running at http://localhost:${PORT}`);
  });
}

startServer();
