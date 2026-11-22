# Usage: python3 scripts/compare.py <page> <width> <y0> <y1> <out> [scale]  — side-by-side crop of reference vs clone
import sys
from PIL import Image
page, w, y0, y1, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
sc = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
a = Image.open(f'reference/{page}/{w}.png').convert('RGB'); b = Image.open(f'qa/clone/{page}/{w}.png').convert('RGB')
c = Image.new('RGB', (w * 2 + 20, y1 - y0), 'white')
c.paste(a.crop((0, y0, w, y1)), (0, 0)); c.paste(b.crop((0, y0, w, y1)), (w + 20, 0))
c.resize((int(c.width * sc), int(c.height * sc))).save(out)
