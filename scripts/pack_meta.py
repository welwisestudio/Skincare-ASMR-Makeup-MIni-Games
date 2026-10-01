from pathlib import Path
from PIL import Image,ImageChops,ImageOps
root=Path(__file__).resolve().parents[1];out=root/'public/assets/ui'
names=[]
def sprite(sheet,name,box,limit=640):
    im=Image.open(root/f'reference/meta/{sheet}.png').convert('RGB');w,h=im.size
    im=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box)))
    r,g,b=im.split();cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
    alpha=cyan.point(lambda v:255 if v<80 else max(0,round((170-v)*255/90)))
    im=im.convert('RGBA');im.putalpha(alpha);im=im.crop(alpha.point(lambda v:255 if v>90 else 0).getbbox());im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    ImageOps.expand(im,border=3,fill=(0,0,0,0)).save(out/f'{name}.webp',quality=96);names.append(name)
for row,color in [(0,'green'),(2,'purple')]:
    for i,name in enumerate(['play','restart','levels','next','finish','ad']):
        sprite('button-symbols',f'symbol-{color}-{name}',(i/6+.008,row/4+.01,(i+1)/6-.008,(row+1)/4-.01),220)
for i,name in enumerate(['chest-closed','chest-open','coin-pile','card-pack','royal-serum','grand-bundle']):
    x,y=i%3,i//3;sprite('reward-objects',name,(x/3+.008,y/3+.008,(x+1)/3-.008,(y+1)/3-.008))
for i,name in enumerate(['bonus-bubbles','bonus-stones','butterfly','rose-bow']):
    x,y=i%2,i//2;sprite('bonus-art',name,(x/2+.008,y/2+.008,(x+1)/2-.008,(y+1)/2-.008))
for i,name in enumerate(['badge-clean','badge-berry','badge-bunny','badge-jade','badge-lipstick','badge-crown']):
    x,y=i%3,i//3;sprite('achievement-art',name,(x/3+.008,y/2+.008,(x+1)/3-.008,(y+1)/2-.008))
for name,box in [('reward-tile',(.01,.02,.31,.41)),('bundle-tile',(.325,.125,.675,.355)),('achievement-frame',(.68,.04,.99,.41)),('ad-badge',(.015,.415,.325,.653)),('calendar',(.35,.423,.65,.655)),('pass-medal',(.68,.49,.99,.99))]:sprite('reward-widgets',name,box)
sprite('lucky-wheel-v2','lucky-wheel',(0,0,1,1),1200)
sprite('zen-stone','zen-stone',(0,0,1,1),440)
(root/'src/meta-assets.js').write_text('export const META_ASSETS='+repr(names).replace("'",'"')+';\n',encoding='utf-8')
print('Packed',len(names),'monetization sprites')
