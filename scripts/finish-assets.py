from PIL import Image
from pathlib import Path
import urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset
Image.open('assets/images/hana-0.webp').resize((64,64)).save('favicon.ico', sizes=[(16,16),(32,32),(64,64)])
for name in ['cormorant','inter']:
    p=Path('assets/fonts/'+name+'.woff2')
    if p.read_bytes()[:4] != b'wOF2':
        font=TTFont(p)
        options=subset.Options()
        options.flavor='woff2'
        sub=subset.Subsetter(options=options)
        sub.populate(unicodes=list(range(0x20,0x180))+list(range(0x2000,0x2070))+[0x20ac,0x2192,0x2197,0x2212])
        sub.subset(font)
        font.flavor='woff2'
        font.save(p)
    print(name, p.read_bytes()[:4], p.stat().st_size)
for name, url in [('cormorant','https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt'), ('inter','https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt')]:
    Path('assets/fonts/'+name+'-LICENSE.txt').write_bytes(urllib.request.urlopen(url).read())
