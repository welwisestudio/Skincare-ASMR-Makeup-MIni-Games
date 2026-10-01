from pathlib import Path
from PIL import Image,ImageDraw
root=Path('test-results/text-layout')
for viewport in ['390x844','844x390']:
    files=sorted(p for p in root.glob(viewport+'-*.png') if not p.stem.endswith('-issue'))
    groups={
      'screens':[p for p in files if p.stem[len(viewport)+1:] in ['levels','pause','collection','rewards','daily','wheel','boxes','coins','shop','purchase','cards','pass','items','help','modes','mode-offer','bonus','reward','ad']],
      'stages':[p for p in files if '-stage-' in p.stem],
      'states':[p for p in files if '-stage-' not in p.stem and p.stem[len(viewport)+1:] not in ['levels','pause','collection','rewards','daily','wheel','boxes','coins','shop','purchase','cards','pass','items','help','modes','mode-offer','bonus','reward','ad']],
    }
    for group,paths in groups.items():
      for start in range(0,len(paths),12):
        selected=paths[start:start+12];wide=viewport.startswith('844');w,h=(500,231) if wide else (250,541);cols=2 if wide else 3;rows=(len(selected)+cols-1)//cols
        sheet=Image.new('RGB',(cols*w,rows*(h+23)),'#faf7f2');draw=ImageDraw.Draw(sheet)
        for i,p in enumerate(selected):
          x=(i%cols)*w;y=(i//cols)*(h+23);im=Image.open(p).convert('RGB').resize((w,h),Image.Resampling.LANCZOS);sheet.paste(im,(x,y));draw.text((x+3,y+h+3),p.stem[len(viewport)+1:],fill='black')
        sheet.save(root/f'review-{viewport}-{group}-{start//12+1}.jpg',quality=92)
