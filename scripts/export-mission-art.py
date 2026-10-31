"""Deterministic exports from preserved AI source art; no source files modified."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'runtime'
OUT.mkdir(exist_ok=True)
manifest = {'status': 'prototype exports; manual animation polish still required', 'assets': []}

def cell(source, col, row, cols, rows):
    image = Image.open(ROOT / 'assets' / 'sources' / source).convert('RGBA')
    if source == 'world_decor_v1.png':
        # Reviewed component bounds recover whole props from the generator's
        # uneven layout. Row 1 merged its two fence variants into one object.
        reviewed=json.loads((ROOT/'assets/sources/world_decor_v1.crops.json').read_text(encoding='utf8'))
        index=(0 if col<2 else col-1) if row==1 else col
        box=reviewed[row][index]['box']
        return image.crop(box),box
    box = (round(col*image.width/cols), round(row*image.height/rows), round((col+1)*image.width/cols), round((row+1)*image.height/rows))
    return image.crop(box), box

def binary_alpha(image):
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 150 else 0))
    return image

# Keep the full logical grid while resizing. Align the feet after resampling,
# never independently stretch different poses to a different character height.
source = 'player_cyborg_v1.png'
animations = [('idle',6,True),('run',10,True),('jump',10,False),('fall',8,True),('land',12,False),('interact',10,False),('build',10,False),('hurt',12,False)]
small = Image.open(ROOT/'assets/sources'/source).convert('RGB').resize((256,512),Image.Resampling.NEAREST)
palette = small.quantize(colors=32,method=Image.Quantize.MEDIANCUT)
for row,(name,fps,loop) in enumerate(animations):
    sheet = Image.new('RGBA',(256,64))
    crops=[]
    for col in range(8):
        frame,box=cell(source,col,row,8,8);crops.append(box)
        frame=binary_alpha(frame.resize((32,64),Image.Resampling.NEAREST))
        alpha=frame.getchannel('A');frame=frame.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');frame.putalpha(alpha)
        bounds=frame.getbbox()
        if bounds:
            aligned=Image.new('RGBA',(32,64));aligned.alpha_composite(frame,(0,63-bounds[3]));frame=aligned
        frame.save(OUT/f'cyborg_{name}_{col}.png');sheet.alpha_composite(frame,(col*32,0))
    sheet.save(OUT/f'cyborg_{name}_sheet.png')
    manifest['assets'].append({'id':'cyborg_'+name,'source':source,'sourceCrops':crops,'frameSize':[32,64],'frames':8,'fps':fps,'loop':loop,'pivot':[16,63],'paletteColors':32,'alpha':'binary'})

def export(name,source,col,row,cols,rows,size,fit=True):
    image,box=cell(source,col,row,cols,rows);image=binary_alpha(image)
    if fit and image.getbbox():
        image=image.crop(image.getbbox());image.thumbnail(size,Image.Resampling.NEAREST)
        frame=Image.new('RGBA',size);frame.alpha_composite(image,((size[0]-image.width)//2,size[1]-image.height));image=frame
    else:image=image.resize(size,Image.Resampling.NEAREST)
    image.save(OUT/(name+'.png'))
    manifest['assets'].append({'id':name,'source':source,'sourceCrop':box,'size':size,'alpha':'binary'})

export('patrol','world_decor_v1.png',4,7,8,8,(32,48))
export('lab_floor','terrain_v1.png',1,5,8,8,(16,16),False)
export('switch_off','logic_devices_v1.png',0,0,8,8,(32,32))
export('switch_on','logic_devices_v1.png',1,0,8,8,(32,32))
export('door_closed','logic_devices_v1.png',2,1,8,8,(16,64))
export('door_open','logic_devices_v1.png',3,1,8,8,(16,64))
export('charge_on','quest_props_v1.png',7,0,8,8,(48,48))
export('charge_off','quest_props_v1.png',0,0,8,8,(48,48))
export('console','quest_props_v1.png',0,2,8,8,(32,48))
export('fuse','world_decor_v1.png',6,1,8,8,(16,24))
export('lift','world_decor_v1.png',2,7,8,8,(48,64))
export('log','ui_icons_v1.png',2,3,4,4,(16,16))
export('pulse','vfx_v1.png',1,0,8,8,(10,4),False)
for name,col,row,size in [
    ('dock_habitat',0,0,(128,128)),('dock_roof',1,0,(64,32)),('dock_sign',3,0,(32,64)),
    ('tech_lantern',4,0,(16,32)),('dock_fence',0,1,(64,32)),('spawn_beacon',2,1,(32,64)),
    ('cargo_crate',3,1,(32,32)),('antenna',4,1,(32,64)),('solar_panel',5,1,(48,48)),
    ('lab_pillar',0,5,(16,64)),('pipe_straight',2,5,(32,16)),('pipe_elbow',3,5,(16,32)),
    ('wall_console',6,5,(32,48)),('ruined_gear',7,5,(32,32)),('hazard_sign',1,6,(32,16)),
    ('lab_vent',3,6,(32,32)),('broken_monitor',4,6,(48,32)),('server_rack',5,6,(32,64)),
    ('lab_desk',6,6,(48,32)),('pipe_valve',6,7,(32,24)),('lab_canister',7,7,(24,48))]:
    export(name,'world_decor_v1.png',col,row,8,8,size)
for name,col,row in [('wall_panel',0,6),('copper_panel',1,4),('glass_panel',4,6),('hazard_tile',6,6),('gantry_tile',4,4)]:
    export(name,'terrain_v1.png',col,row,8,8,(16,16),False)
def animation_family(source,prefix,rows,cols,size):
    master=Image.open(ROOT/'assets/sources'/source).convert('RGB').quantize(colors=32,method=Image.Quantize.MEDIANCUT)
    for row,(name,fps,loop) in enumerate(rows):
        sheet=Image.new('RGBA',(size[0]*cols,size[1]));crops=[]
        for col in range(cols):
            image,box=cell(source,col,row,cols,len(rows))
            # The generated cyborg prone pose occupies the final two source
            # cells. Export it whole and hold it for the final two frames.
            if prefix=='cyborg' and name=='defeat' and col>=6:
                raw=Image.open(ROOT/'assets/sources'/source).convert('RGBA')
                box=(round(raw.width*6/8),round(raw.height*2/3),raw.width,raw.height)
                image=raw.crop(box);bounds=image.getbbox()
                if bounds:image=image.crop(bounds)
                image.thumbnail((30,62),Image.Resampling.NEAREST)
                frame=Image.new('RGBA',size);frame.alpha_composite(image,((size[0]-image.width)//2,size[1]-1-image.height));image=frame
            else:image=image.resize(size,Image.Resampling.NEAREST)
            image=binary_alpha(image);alpha=image.getchannel('A');image=image.convert('RGB').quantize(palette=master,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
            bounds=image.getbbox()
            if bounds:
                frame=Image.new('RGBA',size);frame.alpha_composite(image,(0,size[1]-1-bounds[3]));image=frame
            image.save(OUT/f'{prefix}_{name}_{col}.png');sheet.alpha_composite(image,(col*size[0],0));crops.append(box)
        sheet.save(OUT/f'{prefix}_{name}_sheet.png')
        manifest['assets'].append({'id':prefix+'_'+name,'source':source,'sourceCrops':crops,'frameSize':size,'frames':cols,'fps':fps,'loop':loop,'pivot':[size[0]//2,size[1]-1],'paletteColors':32,'alpha':'binary'})

animation_family('patrol_combat_v1.png','patrol',[('idle',6,True),('walk',8,True),('windup',7,False),('attack',16,False),('hurt',18,False),('defeat',8,False)],4,(32,48))
animation_family('cyborg_combat_v1.png','cyborg',[('shoot',24,True),('dash',30,False),('defeat',10,False)],8,(32,64))
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(f'Exported {len(manifest["assets"])} sprite/animation records into {OUT}')
