from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

root=Path(__file__).resolve().parents[1]
source=root/'reference/puzzles'
dest=root/'public/assets/ui'
names=[]

def save(im,name,cutout=False,limit=960):
    im=im.convert('RGBA')
    if cutout:
        a=np.array(im).astype(float)
        key=np.minimum(a[:,:,1],a[:,:,2])-a[:,:,0]
        a[:,:,3]=np.clip((130-key)/65,0,1)*255
        a[(a[:,:,1]>170)&(a[:,:,2]>170)&(a[:,:,0]<95),3]=0
        im=Image.fromarray(a.astype('uint8'))
        if im.getbbox(): im=im.crop(im.getbbox())
    im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    if cutout:
        padded=Image.new('RGBA',(im.width+8,im.height+8));padded.paste(im,(4,4));im=padded
    im.save(dest/f'puzzle-{name}.webp',quality=95)
    names.append('puzzle-'+name)

for theme in ['meadow','pond','orchard','moon']:
    save(Image.open(source/f'rescue-{theme}.png'),'rescue-'+theme)
for theme in ['tea','garden','vanity','pets']:
    cleaned=source/f'diff-{theme}-clean.png'
    save(Image.open(cleaned if cleaned.exists() else source/f'diff-{theme}.png'),'diff-'+theme)

sheets={
 'rescue-sprites':(3,3,['cat','dog','hive','bee','grass','stone','mushroom','pencil','shield']),
 'memo-backs':(2,2,['back-pets','back-garden','back-sweets','back-beauty']),
 'memo-pets':(3,2,['pet-'+s for s in ['cat','dog','bunny','hamster','turtle','bird']]),
 'memo-garden':(3,2,['garden-'+s for s in ['mushroom','flower','can','butterfly','bee','snail']]),
 'memo-sweets':(3,2,['sweet-'+s for s in ['teapot','cupcake','macaron','cookie','cup','berry']]),
 'memo-beauty':(3,2,['beauty-'+s for s in ['lipstick','brush','perfume','polish','mirror','bow']]),
}
for file,(cols,rows,keys) in sheets.items():
    im=Image.open(source/f'{file}.png');w,h=im.size
    for i,name in enumerate(keys):
        x=i%cols*w/cols;y=i//cols*h/rows
        tile=im.crop((int(x+12),int(y+12),int(x+w/cols-12),int(y+h/rows-12)))
        save(tile,name,True,512)

(root/'src/puzzle-assets.js').write_text('export const PUZZLE_ASSETS='+repr(names).replace("'",'"')+';\n',encoding='utf8')
print('Packed',len(names),'puzzle assets')
