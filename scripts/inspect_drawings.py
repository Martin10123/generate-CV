import sys
sys.stdout.reconfigure(encoding="utf-8")
import fitz

doc = fitz.open(r"C:\Users\Administrador\Documents\docs\CV_MARTIN_C#.pdf")
page = doc[0]
print("drawings count", len(page.get_drawings()))
for i, d in enumerate(page.get_drawings()):
    print(i, "color", d.get("color"), "width", d.get("width"), "rect", d.get("rect"), "items", d.get("items")[:3])
