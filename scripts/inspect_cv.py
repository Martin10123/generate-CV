import sys
sys.stdout.reconfigure(encoding="utf-8")
import fitz

doc = fitz.open(r"C:\Users\Administrador\Documents\docs\CV_MARTIN_C#.pdf")
page = doc[0]
print("pagesize", page.rect)
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if b.get("type") != 0:
        continue
    for line in b.get("lines", []):
        parts = []
        for s in line.get("spans", []):
            bold = bool(s["flags"] & 16)
            italic = bool(s["flags"] & 2)
            y = round(s["bbox"][1], 1)
            x = round(s["bbox"][0], 1)
            parts.append(
                f"y={y} x={x} [{s['font']}|{s['size']:.1f}|b={bold}|i={italic}] {s['text']!r}"
            )
        print(" || ".join(parts))

pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
out = r"C:\Users\Administrador\Desktop\llm_run\run_llm\public\cv-template-preview.png"
pix.save(out)
print("saved", out)

# drawables / links?
print("links", page.get_links())
print("annots", list(page.annots() or []))
