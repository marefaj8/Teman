import { MangaBubble, TranslationPreset } from '../types';

/**
 * Draws speech bubble inpainting and overlays translated text onto an HTML Canvas.
 */
export async function renderMangaPageToCanvas(
  canvas: HTMLCanvasElement,
  imageSource: HTMLImageElement | HTMLVideoElement,
  bubbles: MangaBubble[],
  preset: TranslationPreset,
  highlightedBubbleId?: string | null
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const width = 'videoWidth' in imageSource ? imageSource.videoWidth || 1280 : imageSource.naturalWidth || imageSource.width;
  const height = 'videoHeight' in imageSource ? imageSource.videoHeight || 720 : imageSource.naturalHeight || imageSource.height;

  canvas.width = width;
  canvas.height = height;

  // 1. Draw base image
  ctx.drawImage(imageSource, 0, 0, width, height);

  // 2. Process each bubble
  for (const bubble of bubbles) {
    const [ymin, xmin, ymax, xmax] = bubble.box_2d;
    const x = (xmin / 1000) * width;
    const y = (ymin / 1000) * height;
    const w = ((xmax - xmin) / 1000) * width;
    const h = ((ymax - ymin) / 1000) * height;

    if (w <= 0 || h <= 0) continue;

    const isHighlighted = highlightedBubbleId === bubble.id;

    // 2a. Inpainting / Erasing original text if enabled
    if (preset.eraseOriginalText) {
      ctx.save();
      const bgColor = bubble.backgroundColor || (bubble.type === 'sfx' ? '#000000' : '#ffffff');
      ctx.fillStyle = bgColor;
      ctx.globalAlpha = preset.bubbleOpacity;

      // Draw rounded rectangle or speech bubble ellipse
      const radius = Math.min(16, w * 0.15, h * 0.15);
      drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();

      // Subtle bubble border
      ctx.lineWidth = 2;
      ctx.strokeStyle = bubble.type === 'sfx' ? '#ef4444' : 'rgba(0,0,0,0.4)';
      ctx.stroke();
      ctx.restore();
    }

    // 2b. Draw Highlight outline if focused
    if (isHighlighted) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6366f1';
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.restore();
    }

    // 2c. Render Translated Text
    ctx.save();
    const text = bubble.translatedText;
    const isSfx = bubble.type === 'sfx';

    // Base font sizing scaled to bubble dimensions
    const baseFontSize = Math.max(12, Math.min(w * 0.22, h * 0.18, 36) * preset.fontSizeScale);
    ctx.font = `bold ${baseFontSize}px ${preset.fontFamily}, Cairo, Tajawal, sans-serif`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 8;
    const maxWidth = Math.max(10, w - padding * 2);

    if (isSfx) {
      // Stylized SFX text with stroke
      ctx.fillStyle = bubble.textColor || '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(text, x + w / 2, y + h / 2, maxWidth);
      ctx.fillText(text, x + w / 2, y + h / 2, maxWidth);
    } else {
      // Normal dialog text with auto wrap
      ctx.fillStyle = bubble.textColor || (bubble.backgroundColor === '#000000' ? '#ffffff' : '#0f172a');
      wrapText(ctx, text, x + w / 2, y + padding + 6, maxWidth, baseFontSize * 1.35, h - padding * 2);
    }

    ctx.restore();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  topY: number,
  maxWidth: number,
  lineHeight: number,
  maxHeight: number
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  // Center vertically inside the allocated height
  const totalTextHeight = lines.length * lineHeight;
  let startY = topY + Math.max(0, (maxHeight - totalTextHeight) / 2) + lineHeight / 2;

  for (const line of lines) {
    if (startY > topY + maxHeight) break;
    ctx.fillText(line, centerX, startY);
    startY += lineHeight;
  }
}
