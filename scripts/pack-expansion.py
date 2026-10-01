from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
src=ROOT/'reference/expansion'; dest=ROOT/'public/assets/ui'; dest.mkdir(exist_ok=True)
def pack(im,name,size=900):
    im=im.convert('RGBA'); a=np.array(im).astype(float); r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    # Cyan matte and the thin cyan grid used by the sheet generator.
    key=np.minimum(g,b)-r
    a[:,:,3]=np.clip((135-key)/65,0,1)*255
    a[(g>170)&(b>170)&(r<95),3]=0
    im=Image.fromarray(a.astype('uint8')); box=im.getbbox()
    if box: im=im.crop(box)
    im.thumbnail((size,size),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(im.width+8,im.height+8));out.paste(im,(4,4));out.save(dest/f'world-{name}.webp',quality=96)
    return f'world-{name}'
sheets={
 'tools':(3,3,[(0,'comb'),(1,'scissors'),(2,'iron'),(3,'pet-brush'),(4,'needle'),(8,'jug')]),
 'wardrobe':(3,3,[(0,'party-dress'),(1,'jacket'),(2,'flats'),(6,'handbag'),(4,'hairpin'),(8,'ribbon')]),
 'cosmetics':(3,2,[(0,'lipstick'),(1,'mascara'),(2,'brush'),(3,'blush'),(4,'perfume'),(5,'palette')]),
 'little-treats':(3,3,[(0,'shell'),(1,'macaron-top'),(2,'bath-bomb'),(3,'gem'),(4,'pearl'),(5,'sachet')])}
names=[]
for p in src.glob('*.png'):
 im=Image.open(p)
 if p.stem in ['tools','wardrobe']:
  boxes={'tools':[('comb',(0,0,.33,.36)),('scissors',(.35,.04,.63,.36)),('iron',(.67,.05,1,.34)),('pet-brush',(0,.37,.33,.66)),('needle',(.36,.38,.62,.65)),('jug',(.67,.68,1,1))],
   'wardrobe':[('party-dress',(0,0,.329,.495)),('handbag',(0,.505,.329,1)),('jacket',(.339,0,.661,.327)),('flats',(.672,0,1,.327)),('hairpin',(.339,.34,.661,.66)),('ribbon',(.673,.673,1,1))]}[p.stem]
  for name,box in boxes: names.append(pack(im.crop(tuple(int(v*(im.width if i%2==0 else im.height)) for i,v in enumerate(box))),name,360))
  continue
 if p.stem in sheets:
  cols,rows,cells=sheets[p.stem];w,h=im.size
  for i,name in cells:
   x=i%cols*w/cols;y=i//cols*h/rows
   names.append(pack(im.crop((int(x+10),int(y+10),int(x+w/cols-10),int(y+h/rows-10))),name,360))
 else: names.append(pack(im,p.stem))
(ROOT/'src/world-assets.js').write_text('export const WORLD_ASSETS='+repr(names).replace("'",'"')+';\n',encoding='utf8')
print('Packed',len(names),'sprites')
