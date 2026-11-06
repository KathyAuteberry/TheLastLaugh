#!/usr/bin/env python3
# Measurement helper used for data/geometry/*.json. Needs Pillow + numpy.
# Usage: python3 scripts/measure_yan.py <yan-2000px-image> <annotated-out.png>
"""Detect role icons (tank/healer/dps squares) in a Yan 2000px diagram.
Prints components with centroid (2000px coords) and normalized arena coords; writes an annotated PNG."""
import sys, json, numpy as np
from PIL import Image, ImageDraw
from collections import deque
src, out = sys.argv[1], sys.argv[2]
img = Image.open(src).convert('RGBA'); W,H = img.size
rgb = np.asarray(img.convert('RGB')).astype(int)
a = np.asarray(img)[...,3]
R,G,B = rgb[...,0],rgb[...,1],rgb[...,2]
CX,CY,RAD = 1000,1000,975
masks = {
 'tank':  ((B>150)&(B-R>90)&(B-G>50)) | ((B>35)&(B<70)&(R<15)&(G>10)&(G<40)),
 'healer':((G>130)&(G-R>50)&(G-B>90)) | ((G>35)&(G<65)&(R<15)&(B<15)),
 'dps':   ((R>150)&(R-G>110)&(R-B>110)&(abs(G-B)<25)),
}
def comps(m):
    m = m[::2, ::2].copy(); h,w = m.shape; seen = np.zeros_like(m, bool); res=[]
    for y0,x0 in zip(*np.where(m)):
        if seen[y0,x0]: continue
        q=deque([(y0,x0)]); seen[y0,x0]=True; pts=[]
        while q:
            y,x=q.popleft(); pts.append((y,x))
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy,xx=y+dy,x+dx
                if 0<=yy<h and 0<=xx<w and m[yy,xx] and not seen[yy,xx]:
                    seen[yy,xx]=True; q.append((yy,xx))
        if len(pts) < 150: continue
        ys,xs = np.array(pts).T
        bw,bh = xs.max()-xs.min()+1, ys.max()-ys.min()+1
        if not (30 <= bw <= 75 and 30 <= bh <= 75): continue
        side=max(bw,bh)
        res.append(dict(x=float(xs.min()*2+side), y=float(ys.min()*2+side), w=int(side*2), h=int(side*2), n=len(pts)))
    return res
found=[]
for role,m in masks.items():
    for c in comps(m):
        c['role']=role; c['nx']=round((c['x']-CX)/RAD,3); c['ny']=round((CY-c['y'])/RAD,3); found.append(c)
found.sort(key=lambda c:(c['role'],c['y'],c['x']))
d = ImageDraw.Draw(img)
for i,c in enumerate(found):
    c['i']=i
    d.rectangle([c['x']-c['w']/2,c['y']-c['h']/2,c['x']+c['w']/2,c['y']+c['h']/2], outline=(255,255,0,255), width=3)
    d.text((c['x']+c['w']/2+4, c['y']-30), str(i), fill=(255,255,0,255), font_size=48)
img.convert('RGB').resize((1000,1000)).save(out)
print(json.dumps([{k:c[k] for k in ('i','role','x','y','nx','ny','w','h')} for c in found]))
