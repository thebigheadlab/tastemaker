# Contact sheets of a folder's renders: python3 library/montage.py <folder> <outprefix>
import sys, os, json
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
ids = sorted(f[:-5] for f in os.listdir(d) if f.endswith('.json'))
ims = []
for i in ids:
    p = f"{d}/_renders/{i}.png"
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGB'); im.thumbnail((420, 420)); ims.append((i, im))
cols = 4; cell = 430
rows = [ims[k:k+cols] for k in range(0, len(ims), cols)]
pages = [rows[k:k+3] for k in range(0, len(rows), 3)]
for n, pg in enumerate(pages):
    H = sum(max(i.size[1] for _, i in r) + 16 for r in pg)
    sh = Image.new('RGB', (cols*cell, H), '#777'); dr = ImageDraw.Draw(sh); y = 0
    for r in pg:
        h = max(i.size[1] for _, i in r)
        for j, (cid, im) in enumerate(r):
            sh.paste(im, (j*cell, y)); dr.text((j*cell+2, y+h+2), cid, fill='white')
        y += h + 16
    sh.save(f"{out}-{n}.png"); print(f"{out}-{n}.png")
