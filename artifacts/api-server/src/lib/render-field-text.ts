import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const NOTO_NASKH_PATH = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "NotoNaskhArabic-Regular.ttf",
);
const DEJAVU_SANS_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

let fontsRegistered = false;

function ensureFonts(): void {
  if (fontsRegistered) return;
  if (fs.existsSync(NOTO_NASKH_PATH)) {
    GlobalFonts.registerFromPath(NOTO_NASKH_PATH, "NotoNaskh");
  }
  if (fs.existsSync(DEJAVU_SANS_PATH)) {
    GlobalFonts.registerFromPath(DEJAVU_SANS_PATH, "DejaVuSans");
  }
  fontsRegistered = true;
}

const FONT_STACK = "NotoNaskh, DejaVuSans, serif";
const RENDER_SCALE = 3;
const MIN_FONT_SIZE_PT = 6;

export interface FieldRenderOptions {
  text: string;
  fieldWidthPt: number;
  fieldHeightPt: number;
  initialFontSizePt: number;
  paddingPt?: number;
}

/**
 * Render a text string (Arabic-first, RTL) to a transparent PNG buffer.
 *
 * Uses @napi-rs/canvas with Skia for correct Arabic shaping, BiDi, and
 * automatic font fallback to DejaVuSans for Latin/numeric characters.
 *
 * The PNG is rendered at RENDER_SCALE×resolution for PDF quality, then
 * must be drawn at the original field dimensions in the PDF.
 */
export function renderFieldTextToPng(opts: FieldRenderOptions): Buffer {
  ensureFonts();

  const {
    text,
    fieldWidthPt,
    fieldHeightPt,
    initialFontSizePt,
    paddingPt = 4,
  } = opts;

  const W = Math.max(1, Math.round(fieldWidthPt * RENDER_SCALE));
  const H = Math.max(1, Math.round(fieldHeightPt * RENDER_SCALE));
  const padPx = paddingPt * RENDER_SCALE;
  const maxTextWidth = W - padPx * 2;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, W, H);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#111827";

  // Auto-scale font size to fit within field width
  let fontSizePx = Math.max(
    MIN_FONT_SIZE_PT * RENDER_SCALE,
    initialFontSizePt * RENDER_SCALE,
  );

  ctx.font = `${fontSizePx}px ${FONT_STACK}`;
  let textWidth = ctx.measureText(text).width;

  while (textWidth > maxTextWidth && fontSizePx > MIN_FONT_SIZE_PT * RENDER_SCALE) {
    fontSizePx = Math.max(
      MIN_FONT_SIZE_PT * RENDER_SCALE,
      fontSizePx * (maxTextWidth / textWidth) * 0.95,
    );
    ctx.font = `${fontSizePx}px ${FONT_STACK}`;
    textWidth = ctx.measureText(text).width;
  }

  // Clip to field bounds (never overflow)
  ctx.save();
  ctx.rect(padPx, 0, W - padPx * 2, H);
  ctx.clip();

  ctx.fillText(text, W - padPx, H / 2);
  ctx.restore();

  return canvas.toBuffer("image/png");
}
