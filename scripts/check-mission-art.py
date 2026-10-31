from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parent.parent/'assets/runtime'
manifest=json.loads((root/'manifest.json').read_text(encoding='utf8'));checked=0
for item in manifest['assets']:
    assert (root.parent/'sources'/item['source']).is_file(),f'Missing preserved source: {item["source"]}'
    files=[(root/item['directory']/f"{item['id']}_{i}.png",tuple(item['frameSize'])) for i in range(item['frames'])] if 'frames' in item else [(root/item['directory']/f"{item['id']}.png",tuple(item['size']))]
    for index,(file,size) in enumerate(files):
        image=Image.open(file)
        assert image.size==size,(file,image.size,size)
        assert image.mode=='RGBA',(file,image.mode)
        if index in item.get('emptyFrames',[]):assert image.getchannel('A').getbbox() is None,f'Expected clear animation tail: {file}'
        else:assert image.getchannel('A').getbbox(),f'Empty sprite: {file}'
        assert set(image.getchannel('A').tobytes())<={0,255},f'Nonbinary alpha: {file}'
        if 'paletteColors' in item:
            pixels=image.tobytes();colors={pixels[i:i+3] for i in range(0,len(pixels),4) if pixels[i+3]}
            assert len(colors)<=item['paletteColors'],(file,len(colors))
        checked+=1
print(f'PASS: {checked} runtime frames/sprites have exact sizes, RGBA, binary alpha and declared palettes; only declared clear animation tails may be empty.')
