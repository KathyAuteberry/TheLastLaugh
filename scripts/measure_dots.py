#!/usr/bin/env python3
# Measurement helper for Yan diagrams that mark players with plain dots (P2 Forsaken) instead of role icons.
# Usage: python3 scripts/measure_dots.py <yan-2000px-image>...  Needs Pillow + numpy.
# Prints each cyan dot centre (2000 px coords) and normalised arena coords (centre 1000,1000; radius 975).
import sys, numpy as np
from PIL import Image
from collections import deque
def label(m):
    seen=np.zeros_like(m,bool); out=[]
    h,w=m.shape
    for y0,x0 in zip(*np.where(m)):
        if seen[y0,x0]: continue
        q=deque([(y0,x0)]); seen[y0,x0]=True; pts=[]
        while q:
            y,x=q.popleft(); pts.append((y,x))
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy,xx=y+dy,x+dx
                if 0<=yy<h and 0<=xx<w and m[yy,xx] and not seen[yy,xx]: seen[yy,xx]=True; q.append((yy,xx))
        out.append(np.array(pts))
    return out
for f in sys.argv[1:]:
    rgb=np.asarray(Image.open(f).convert('RGB')).astype(int); R,G,B=rgb[...,0],rgb[...,1],rgb[...,2]
    print(f)
    for name,m in [('cyan',(R<90)&(G>200)&(B>200))]:
        for pts in label(m):
            if len(pts)<80: continue
            cy,cx=pts.mean(0)
            print(f"  {name} n={len(pts)} px=({cx:.0f},{cy:.0f}) norm=({(cx-1000)/975:.3f},{(1000-cy)/975:.3f})")
