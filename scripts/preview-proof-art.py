"""Contact sheets and animated review artifacts from the validated runtime PNGs."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'assets/previews/v2';OUT.mkdir(parents=True,exist_ok=True)
assets=json.loads((ROOT/'assets/manifests/v2/proof.json').read_text(encoding='utf8'))['assets']
animations=[a for a in assets if 'frames' in a]
sheet=Image.new('RGB',(96*12,100*len(animations)),(9,18,31));draw=ImageDraw.Draw(sheet)
for row,a in enumerate(animations):
    draw.text((4,row*100+3),a['id'],fill=(180,224,225))
    for col,file in enumerate(a['files']):
        im=Image.open(ROOT/file);sheet.paste(im,(col*96,row*100+20),im)
sheet.save(OUT/'all-animation-frames.png')
players=[a for a in animations if a['family']=='player'];frames=[]
for index in range(12):
    frame=Image.new('RGB',(768,192),(9,18,31));d=ImageDraw.Draw(frame)
    for col,a in enumerate(players):
        d.text((col*192+8,8),a['id'],fill=(180,224,225));im=Image.open(ROOT/a['files'][index]).resize((192,160),Image.Resampling.NEAREST);frame.paste(im,(col*192,28),im)
    frames.append(frame)
frames[0].save(OUT/'player-states.gif',save_all=True,append_images=frames[1:],duration=100,loop=0)
print('Wrote V2 all-frame contact sheet and slowed player comparison GIF (10fps review, not gameplay timing).')
