from pathlib import Path
import urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset
import io
fonts={'cormorant':'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf','inter':'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf'}
for name,url in fonts.items():
    font=TTFont(io.BytesIO(urllib.request.urlopen(url).read()))
    options=subset.Options()
    sub=subset.Subsetter(options=options)
    sub.populate(unicodes=list(range(0x20,0x180))+list(range(0x2000,0x2070))+[0x20ac,0x2192,0x2197,0x2212])
    sub.subset(font)
    font.flavor='woff2'
    font.save('assets/fonts/'+name+'.woff2')
    print(name, 'variable axes:', [a.axisTag for a in font['fvar'].axes])
