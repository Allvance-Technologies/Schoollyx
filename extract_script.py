import fitz
import re
import json

doc = fitz.open(r'D:\MyDocs\Schoollyx\Schoollex_Catalog.pdf')

with open(r'd:\MyDocs\Schoollyx\raw_dump.txt', 'w', encoding='utf-8') as out:
    for page_idx, page in enumerate(doc):
        out.write(f"\n================ PAGE {page_idx + 1} ================\n")
        blocks = page.get_text("blocks")
        # sort by y0, then x0
        blocks.sort(key=lambda b: (b[1], b[0]))
        for b in blocks:
            text = b[4].strip()
            if text:
                out.write(f"[{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] {repr(text)}\n")

print("Dumped raw blocks to raw_dump.txt")
