---
name: Arabic text in pdf-lib
description: How to correctly render Arabic text in pdf-lib with @pdf-lib/fontkit
---

## Rule
Pass original Arabic Unicode text directly to `page.drawText()` — do NOT reshape or reverse.

**Why:** fontkit (used internally by pdf-lib via `pdfDoc.registerFontkit(fontkit)`) applies full GSUB shaping AND BiDi visual reordering automatically when `font.encodeText()` is called. Any pre-processing (reshape + reverse) causes fontkit to re-process already-processed text, producing garbled output.

**Verified:** `font.encodeText("اسم")` returns glyphs in correct visual LTR order [meem-final, seen-initial, alef] with correct contextual forms. The `arabic-reshaper` + reverse approach is wrong because it fights with fontkit's own shaping engine.

**How to apply:** 
- Embed Noto Naskh Arabic with `{ subset: false }` 
- Use `pdfDoc.registerFontkit(fontkit)` before embedFont
- Pass raw Arabic string to `page.drawText(rawText, { font: arabicFont, ... })`
- Right-align text manually: `x = fieldX + fieldWidth - arabicFont.widthOfTextAtSize(text, fontSize) - padding`
