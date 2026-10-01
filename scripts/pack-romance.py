from pathlib import Path
from PIL import Image
import numpy as np
import json

root=Path(__file__).resolve().parents[1]
source=root/'reference/romance'; dest=root/'public/assets/ui'
names=[]
# Some generated sheets contain extra pose variants. These audited cell maps
# select the six intended narrative states, retaining the unused masters.
layouts={
 'rose':(6,[0,1,3,6,7,11]),'pearl':(6,[0,1,2,6,7,11]),
 'violet':(6,[0,1,2,6,7,11]),'cherry':(4,[0,1,2,4,5,7]),
 'sunflower':(3,[0,1,2,3,4,5]),'winter':(3,[0,1,2,3,4,5]),
 'amber':(4,[0,1,2,4,5,7]),'moon':(5,[0,1,2,5,6,9]),
 'coral':(4,[0,1,2,4,5,7]),'emerald':(6,[0,1,2,6,7,11]),
}
states=['before','clean','hair','dress','styled','bride']
def keyout(im):
    a=np.array(im.convert('RGBA')).astype(float)
    key=np.minimum(a[:,:,1],a[:,:,2])-a[:,:,0]
    a[:,:,3]*=np.clip((135-key)/65,0,1)
    a[(a[:,:,1]>160)&(a[:,:,2]>160)&(a[:,:,0]<110),3]=0
    # Remove cyan contamination from antialiased outlines, preserving white lace.
    alpha=a[:,:,3:4]/255
    a[:,:,:3]=np.clip((a[:,:,:3]-(1-alpha)*np.array([0,255,255]))/np.maximum(alpha,.01),0,255)
    im=Image.fromarray(a.astype('uint8'))
    return im.crop(im.getbbox())
def save(im,name,limit=1000):
    im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    im.save(dest/f'romance-{name}.webp',quality=94)
    names.append('romance-'+name)
for key,(cols,cells) in layouts.items():
    im=Image.open(source/f'actors-{key}.png');w,h=im.size
    for state,idx in zip(states,cells):
        repaired=source/f'{state}-{key}-repaired.png'
        if repaired.exists():
            # Full-silhouette masters replace atlas cells that clipped wide gowns.
            # Preserve their native alpha; do not chroma-key translucent veils.
            actor=Image.open(repaired).convert('RGBA')
            actor=actor.crop(actor.getbbox())
        else:
            x=idx%cols*w/cols;y=idx//cols*h/2
            actor=keyout(im.crop((round(x+10),round(y+10),round(x+w/cols-10),round(y+h/2-10))))
        actor.thumbnail((510,566),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(600,640));canvas.paste(actor,((600-actor.width)//2,604-actor.height))
        save(canvas,f'{key}-{state}')
        if state=='dress':
            # An actual preview of this heroine's garment in the drag tray.
            item=actor.crop((0,round(actor.height*.30),actor.width,round(actor.height*.92)))
            save(item,f'{key}-gown',400)
    story=source/f'story-{key}.png'
    if story.exists():
        im=Image.open(story);w,h=im.size
        for side,state in enumerate(['proposal','wedding']):
            save(im.crop((round(side*w/2+4),4,round((side+1)*w/2-4),h-4)),f'{key}-{state}',1100)
props=source/'props.png'
if props.exists():
    im=Image.open(props);w,h=im.size
    for i,name in enumerate(['shower','brush','ring','ringbox','necklace','tiara']):
        x=i%3*w/3;y=i//3*h/2
        save(keyout(im.crop((round(x+10),round(y+10),round(x+w/3-10),round(y+h/2-10)))),name,420)
(root/'src/romance-assets.js').write_text('export const ROMANCE_ASSETS='+json.dumps(names)+';\n',encoding='utf8')
print('Packed',len(names),'romance assets')
