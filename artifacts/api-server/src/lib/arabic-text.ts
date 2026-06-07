// eslint-disable-next-line @typescript-eslint/no-require-imports
const { convertArabic } = require("arabic-reshaper") as {
  convertArabic: (text: string) => string;
};

const ARABIC_CHAR_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabic(text: string): boolean {
  return ARABIC_CHAR_RE.test(text);
}

// LTR "islands" within RTL text: digit/Latin sequences + connecting punctuation/spaces.
// Internal spaces (between two alphanumeric tokens) are treated as part of the LTR run
// so that "Root Canal" stays as one unit and is not split+reversed.
const LTR_RUN_RE =
  /[0-9A-Za-z\u00C0-\u024F]+(?:[ \t/\-:.][0-9A-Za-z\u00C0-\u024F]+)*/g;

export type TextSegment = { type: "arabic" | "latin"; text: string };

/**
 * Split and shape `text` into ordered visual segments suitable for LTR
 * rendering in pdf-lib.
 *
 * - "arabic" segments: Arabic presentation-form chars in visual LTR order
 *   (render with the Arabic font).
 * - "latin" segments: digits, Latin letters, punctuation in logical order
 *   (render with a Latin fallback font like Helvetica).
 *
 * The returned array is in the visual left-to-right order needed for
 * sequential rendering inside a right-aligned text box.
 */
export function getTextSegments(text: string): TextSegment[] {
  if (!hasArabic(text)) {
    // Pure Latin/numeric – single LTR segment
    return [{ type: "latin", text }];
  }

  // 1. Shape Arabic characters into contextual presentation forms
  const shaped = convertArabic(text);

  // 2. Split shaped text into RTL (Arabic) and LTR (Latin/numeric) runs
  const rawSegments: Array<{ type: "rtl" | "ltr"; text: string }> = [];
  LTR_RUN_RE.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LTR_RUN_RE.exec(shaped)) !== null) {
    if (match.index > lastIndex) {
      rawSegments.push({ type: "rtl", text: shaped.slice(lastIndex, match.index) });
    }
    rawSegments.push({ type: "ltr", text: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < shaped.length) {
    rawSegments.push({ type: "rtl", text: shaped.slice(lastIndex) });
  }

  // 3. RTL paragraph: reverse segment order, reverse chars within RTL segments
  const visualSegments = rawSegments
    .reverse()
    .map((seg): TextSegment =>
      seg.type === "rtl"
        ? { type: "arabic", text: [...seg.text].reverse().join("") }
        : { type: "latin", text: seg.text },
    );

  return visualSegments;
}

/**
 * Convenience: returns a single shaped+reordered string (for width measurement
 * when a single-font path is acceptable, e.g. pure-Arabic fields).
 * For mixed content, prefer getTextSegments() + per-segment font rendering.
 */
export function prepareArabicText(text: string): string {
  return getTextSegments(text)
    .map((s) => s.text)
    .join("");
}
