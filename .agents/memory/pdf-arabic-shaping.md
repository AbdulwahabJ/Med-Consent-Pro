---
name: Arabic text in pdf-lib
description: How to correctly render Arabic text in pdf-lib with @pdf-lib/fontkit and NotoNaskhArabic font
---

## Working Solution (verified with screenshots)

Use `arabic-reshaper` (convertArabic) + custom BiDi visual reorder + **multi-font segment rendering**
(NotoNaskhArabic for Arabic, Helvetica for Latin/digits/punctuation).

**Why NOT raw Unicode pass-through:** Despite fontkit theoretically handling GSUB, passing raw Arabic Unicode to NotoNaskhArabic-Regular.ttf via pdf-lib produces **disconnected letters** in practice. Pre-shaping with arabic-reshaper is required.

**Why multi-font:** NotoNaskhArabic-Regular.ttf does NOT have glyphs for "/", "-", Latin letters (A-Z). fontkit returns notdef-width (9.044 pt) for missing chars and they render as boxes. Helvetica handles all ASCII including dates, slashes, Latin phrases.

## The Algorithm (in `artifacts/api-server/src/lib/arabic-text.ts`)

1. `convertArabic(text)` → presentation forms (U+FE70-FEFF range)
2. Split on `LTR_RUN_RE` (digits/Latin + connecting punct/internal-spaces) to find LTR islands
3. Reverse segment order (RTL paragraph), reverse chars within RTL segments
4. Return `TextSegment[]` with `type: "arabic" | "latin"`

**Critical regex detail:** LTR runs include internal spaces (`[ \t]` in connector class) so "Root Canal" stays as one segment, not split+reversed to "Canal Root".

## Rendering (in `consents.routes.ts`)

```
arabicFont = pdfDoc.embedFont(NotoNaskhArabic.ttf, { subset: false })
latinFont  = pdfDoc.embedFont(StandardFonts.Helvetica)

segments = getTextSegments(rawValue.trim())
totalWidth = sum of each segment's widthOfTextAtSize with its own font
startX = right-aligned: fieldX + fieldWidth - totalWidth - padding
draw each segment left-to-right with its font, advancing curX by segWidth
```

**How to apply:**
- Always call `pdfDoc.registerFontkit(fontkit)` before embedFont
- `{ subset: false }` required for NotoNaskhArabic (fontkit must see full cmap)
- Use `getTextSegments()` for any field value; use `latinFont` for date/number-only fields too
- White rectangle background before text covers template's fill-in dots
