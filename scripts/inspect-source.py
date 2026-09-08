from html.parser import HTMLParser
from pathlib import Path
class Parser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        if tag in ('a', 'img', 'iframe'):
            print(tag, dict(attrs))
Parser().feed(Path('assets/source-hana.html').read_text(encoding='utf-8'))
import re
source = Path('assets/source-hana.html').read_text(encoding='utf-8')
print('\nASSETS\n' + '\n'.join(dict.fromkeys(re.findall(r'https?[^\s"\)<>]+', source))))
