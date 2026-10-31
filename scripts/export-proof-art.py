"""Technical slicing, shared scaling, alignment and palette export of V2 art.

Original generated PNGs are never modified. This performs no painted pose edits.
"""
from pathlib import Path
from statistics import median
from PIL import Image
import json,hashlib

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'assets/sources/v2';OUT=ROOT/'assets/runtime/v2'
SPEC=json.loads((ROOT/'assets/manifests/v2/proof-spec.json').read_text(encoding='utf8'))

def clean(image):
    image=image.convert('RGBA');image.putalpha(image.getchannel('A').point(lambda a:255 if a>=180 else 0));return image

def cells(file):
    raw=Image.open(SOURCE/file).convert('RGBA')
    if raw.getchannel('A').getextrema()[0]>0:raise ValueError(f'{file}: sprite source has no transparent background')
    frames=[];boxes=[]
    if file.startswith('characters/'):
        # The generator's character columns can cross nominal grid boundaries.
        # Recover whole connected silhouettes, then record reviewed crop bounds.
        cache=(SOURCE/file).with_suffix('.crops.json');digest=hashlib.sha256((SOURCE/file).read_bytes()).hexdigest()
        reviewed=json.loads(cache.read_text(encoding='utf8')) if cache.exists() else {}
        if reviewed.get('sha256')==digest:boxes=reviewed['boxes']
        else:
            mask=bytearray(clean(raw).getchannel('A').tobytes());width,height=raw.size;components=[]
            for seed in range(len(mask)):
                if not mask[seed]:continue
                stack=[seed];mask[seed]=0;count=0;left=width;top=height;right=bottom=0
                while stack:
                    pos=stack.pop();yy,xx=divmod(pos,width);count+=1
                    left=min(left,xx);right=max(right,xx);top=min(top,yy);bottom=max(bottom,yy)
                    for nxt in (pos-width if yy else -1,pos+width if yy<height-1 else -1,pos-1 if xx else -1,pos+1 if xx<width-1 else -1):
                        if nxt>=0 and mask[nxt]:mask[nxt]=0;stack.append(nxt)
                if count>100:components.append((count,[left,top,right+1,bottom+1]))
            selected=sorted(components,reverse=True)[:12]
            if len(selected)!=12:raise ValueError(f'{file}: expected12 character silhouettes, found{len(selected)}')
            ordered=sorted([box for count,box in selected],key=lambda b:(b[1]+b[3])/2)
            for row in range(3):boxes.extend(sorted(ordered[row*4:row*4+4],key=lambda b:b[0]))
            cache.write_text(json.dumps({'sha256':digest,'method':'12 largest connected silhouettes; row-major whole-object crops','boxes':boxes},indent=2)+'\n',encoding='utf8')
        return raw,[clean(raw.crop(box)) for box in boxes],boxes
    for row in range(3):
        for col in range(4):
            box=[round(col*raw.width/4),round(row*raw.height/3),round((col+1)*raw.width/4),round((row+1)*raw.height/3)]
            frames.append(clean(raw.crop(box)));boxes.append(box)
    return raw,frames,boxes

# A single normalized pixel scale for all player animations; never fit each pose.
master,master_frames,_=cells(SPEC['animations'][0]['source'])
heights=[f.getbbox()[3]-f.getbbox()[1] for f in master_frames]
player_scale=62/median(heights)
master_h=master.height/3
family_palettes={}
manifest={'version':2,'status':SPEC['status'],'assets':[]}
# Generated columns are not perfectly spaced. Locate the head (above the rifle)
# as a rigid registration landmark, then retain the idle family's root offset.
def head_center(frame):
    b=frame.getbbox();head=frame.crop((0,b[1],frame.width,round(b[1]+(b[3]-b[1])*.16))).getbbox()
    return (head[0]+head[2])/2
root_offsets=[]
for frame in master_frames:
    b=frame.getbbox();foot=frame.crop((0,b[3]-6,frame.width,b[3])).getbbox()
    root_offsets.append(((foot[0]+foot[2])/2-head_center(frame))/frame.height)
root_offset=median(root_offsets)
for item in SPEC['animations']:
    raw,frames,boxes=cells(item['source']);w,h=item['size'];root=item['root']
    if item['family'] not in family_palettes:
        # Ignore invisible RGB noise when selecting the family palette.
        rgb=Image.new('RGB',raw.size,(23,37,55));rgb.paste(raw,mask=raw.getchannel('A'))
        family_palettes[item['family']]=rgb.quantize(colors=32,method=Image.Quantize.MEDIANCUT)
    palette=family_palettes[item['family']]
    if item['family']=='player':scale=player_scale*master_h/(raw.height/3)
    else:
        max_w=max(f.getbbox()[2]-f.getbbox()[0] for f in frames);max_h=max(f.getbbox()[3]-f.getbbox()[1] for f in frames)
        target_h=48 if item['family']=='patrol' else h-8
        scale=min((w-8)/max_w,target_h/max_h)
    directory=item['family'];dest=OUT/directory;dest.mkdir(parents=True,exist_ok=True)
    exported=[];bounds=[];clipped=[];muzzles=[];sheet=Image.new('RGBA',(w*4,h*3))
    # Register character heads to the shared idle root; center non-character
    # source cells. Never center a character by the gun's changing silhouette.
    anchor=.5
    for index,frame in enumerate(frames):
        source_anchor=head_center(frame)+root_offset*frame.height if item['family']=='player' else anchor*frame.width
        resized=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.NEAREST)
        b=resized.getbbox()
        if not b:raise ValueError(f'Empty frame {item["id"]} {index}')
        x=round(root[0]-source_anchor*resized.width/frame.width);y=root[1]-b[3]
        clipped.append(x+b[0]<0 or x+b[2]>w or y+b[1]<0 or y+b[3]>h)
        result=Image.new('RGBA',(w,h));result.alpha_composite(resized,(x,y))
        alpha=result.getchannel('A');result=result.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');result.putalpha(alpha)
        if item['family']=='player':
            points=[(xx,yy) for yy in range(20,48) for xx in range(w) if alpha.getpixel((xx,yy))]
            tip=max(xx for xx,yy in points);ys=[yy for xx,yy in points if xx>=tip-1]
            muzzles.append([tip,round(sum(ys)/len(ys))])
        file=dest/f'{item["id"]}_{index:02}.png';result.save(file);exported.append(file.relative_to(ROOT).as_posix());bounds.append(result.getbbox())
        sheet.alpha_composite(result,((index%4)*w,(index//4)*h))
    sheet.save(dest/f'{item["id"]}_sheet.png')
    manifest['assets'].append({**item,'source':'assets/sources/v2/'+item['source'],'frames':12,'files':exported,'sourceCrops':boxes,'bounds':bounds,'clipped':clipped,'muzzles':muzzles,'paletteColors':32,'alpha':'binary','sheet':(dest/f'{item["id"]}_sheet.png').relative_to(ROOT).as_posix(),'pixelScale':scale})
for item in SPEC['images']:
    image=clean(Image.open(SOURCE/item['source'])).resize(tuple(item['size']),Image.Resampling.NEAREST)
    dest=OUT/item['family'];dest.mkdir(parents=True,exist_ok=True);file=dest/(item['id']+'.png');image.save(file)
    manifest['assets'].append({**item,'source':'assets/sources/v2/'+item['source'],'file':file.relative_to(ROOT).as_posix(),'alpha':'binary'})
(ROOT/'assets/manifests/v2/proof.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(f'Exported {len(manifest["assets"])} V2 records, {sum(a.get("frames",1) for a in manifest["assets"])} images; sources preserved.')
