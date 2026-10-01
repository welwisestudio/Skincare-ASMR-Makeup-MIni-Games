"""Contact sheets of unmodified browser screenshots for visual inspection."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
root=Path(__file__).resolve().parents[1]/'test-results'
level=int(sys.argv[1])
for orientation,cols,cell in [('phone',5,(290,660)),('square',3,(410,442)),('wide',2,(600,308))]:
    files=sorted((root/'visual-stages').glob(f'L{level}-S*-{orientation}.png'))
    if not files:continue
    cols=min(cols,len(files));rows=(len(files)+cols-1)//cols
    sheet=Image.new('RGB',(cols*cell[0],rows*cell[1]),'#fff8fc');draw=ImageDraw.Draw(sheet)
    for i,path in enumerate(files):
        image=Image.open(path).convert('RGB');image.thumbnail((cell[0]-10,cell[1]-30),Image.Resampling.LANCZOS)
        x=(i%cols)*cell[0];y=(i//cols)*cell[1]
        draw.text((x+8,y+5),path.stem,fill='#573a69')
        sheet.paste(image,(x+(cell[0]-image.width)//2,y+25))
    sheet.save(root/f'review-L{level}-{orientation}.jpg',quality=94)
print(f'Review sheets for level {level} ready')
