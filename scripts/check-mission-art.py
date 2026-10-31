from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parent.parent/'assets/runtime'
manifest=json.loads((root/'manifest.json').read_text(encoding='utf8'));checked=0
for item in manifest['assets']:
    files=[(root/f"{item['id']}_{i}.png",tuple(item['frameSize'])) for i in range(item['frames'])] if 'frames' in item else [(root/f"{item['id']}.png",tuple(item['size']))]
    for file,size in files:
        image=Image.open(file)
        assert image.size==size,(file,image.size,size)
        assert image.mode=='RGBA',(file,image.mode)
        assert image.getchannel('A').getbbox(),f'Empty sprite: {file}'
        assert set(image.getchannel('A').tobytes())<={0,255},f'Nonbinary alpha: {file}'
        if 'paletteColors' in item:
            pixels=image.tobytes();colors={pixels[i:i+3] for i in range(0,len(pixels),4) if pixels[i+3]}
            assert len(colors)<=item['paletteColors'],(file,len(colors))
        checked+=1
print(f'PASS: {checked} runtime frames/sprites have exact sizes, nonempty RGBA, binary alpha and declared palettes.')
