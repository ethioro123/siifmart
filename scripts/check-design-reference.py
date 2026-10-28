"""Check the normative reference palette and local design handbook links."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'docs/design/examples/component-reference.html'
palette = json.loads(re.search(r'<script id="reference-palette" type="application/json">(.*?)</script>', HTML.read_text(), re.S).group(1))

def luminance(color):
    channels = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(v * weight for v, weight in zip(linear, (.2126, .7152, .0722)))

def ratio(a, b):
    values = sorted((luminance(a), luminance(b)))
    return (values[1] + .05) / (values[0] + .05)

failures = []
checked = 0
spec = (ROOT / 'docs/design/15-states-and-theme-pairs.md').read_text().upper()
for theme, colors in palette.items():
    pairs = [(fg, bg, 4.5) for fg in ('text', 'secondary', 'muted') for bg in ('surface', 'canvas', 'hover', 'selected')]
    pairs += [('accent', bg, 4.5) for bg in ('surface', 'canvas')]
    pairs += [('on-primary', bg, 4.5) for bg in ('primary', 'primary-hover')]
    pairs += [(state, state + '-bg', 4.5) for state in ('danger', 'success', 'warning')]
    pairs += [('danger', bg, 4.5) for bg in ('surface', 'canvas')]
    pairs += [('border', bg, 3) for bg in ('surface', 'canvas', 'hover', 'selected')]
    pairs += [('accent', bg, 3) for bg in ('surface', 'hover', 'selected')]
    for fg, bg, minimum in pairs:
        actual = ratio(colors[fg], colors[bg])
        checked += 1
        if actual < minimum:
            failures.append(f'{theme}: {fg}/{bg} = {actual:.4f}, below {minimum}')
    for value in colors.values():
        if value.upper() not in spec:
            failures.append(f'{theme}: palette value {value} missing from specification')

files = [ROOT / 'APPLE_DESIGN_GUIDE.md', ROOT / 'docs/APPLE_DESIGN_GUIDE.md', *sorted((ROOT / 'docs/design').glob('*.md'))]
for path in files:
    text = path.read_text()
    if len(text.splitlines()) >= 500:
        failures.append(f'{path.name}: exceeds file-size policy')
    for target in re.findall(r'\]\(([^)]+)\)', text):
        if target.startswith(('https:', 'http:', '#', 'mailto:')):
            continue
        if not (path.parent / target.split('#')[0].strip('<>')).exists():
            failures.append(f'{path.name}: missing local link {target}')
if failures:
    raise SystemExit('\n'.join(failures))
print(f'PASS: {checked} solid contrast pairs; {len(files)} handbook documents; reference palette/spec agreement.')
