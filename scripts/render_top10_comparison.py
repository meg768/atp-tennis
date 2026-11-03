"""Render the verified comparison as a two-column PNG (requires Pillow)."""
import ast
from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'analysis/top10-comparison-direct'


def main():
    tree = ast.parse((ROOT / 'analysis/top10-verification/check.py').read_text())
    original = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                    and any(isinstance(t, ast.Name) and t.id == 'image' for t in n.targets))
    original = {'Sinner' if k == 'Draper' else k: v for k, v in original.items()}
    rows = json.loads((FOLDER / 'results-with-fallback.json').read_text())
    assert len(rows) == len(original) == 30
    def pct(w, l):
        return str((Decimal(100)*w/(w+l)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)).replace('.', ',')
    def rate(r):
        return Decimal(r['wins']) / (r['wins'] + r['losses'])
    image = Image.new('RGB', (2600, 2160), '#f1f5f9')
    draw = ImageDraw.Draw(image)
    font_path = '/System/Library/Fonts/Supplemental/'
    def font(size, bold=False):
        return ImageFont.truetype(font_path + ('Arial Bold.ttf' if bold else 'Arial.ttf'), size)
    def text(x, y, value, size=29, color='#172b44', bold=False, anchor=None):
        draw.text((x, y), value, fill=color, font=font(size, bold), anchor=anchor)
    draw.rectangle((0, 0, 2600, 200), fill='#112a43')
    text(65, 35, 'KARRIÄRSTATISTIK MOT TOPP 10', 54, '#ffffff', True)
    text(65, 115, 'Bildens uppgifter  (databasens uppgifter)  •  Kompletterad rankinghistorik', 32, '#cbd9e8')
    orders = [sorted(rows, key=lambda r: (-r['wins'], -rate(r), r['name'])),
              sorted(rows, key=lambda r: (-rate(r), -r['wins'], r['name']))]
    for panel, order in enumerate(orders):
        x = 55 + panel * 1270
        width = 1220
        draw.rectangle((x, 235, x+width, 1880), fill='white')
        draw.rectangle((x, 235, x+width, 315), fill='#0d746c')
        text(x+25, 253, 'SORTERAT PÅ ' + ('VINSTER' if panel == 0 else 'VINSTPROCENT'), 35, 'white', True)
        columns = [x+26, x+92, x+650, x+895, x+1190]
        for xx, label, anchor in zip(columns, ['#', 'SPELARE', 'W', 'L', '% W'], [None, None, 'ra', 'ra', 'ra']):
            text(xx, 340, label, 27, '#53677e', True, anchor)
        for i, row in enumerate(order):
            y = 390 + i * 49
            if i % 2 == 0:
                draw.rectangle((x+1, y-6, x+width-1, y+42), fill='#edf3f8')
            name = row['name'].split()[-1]
            w, l = original[name]
            dw, dl = row['wins'], row['losses']
            values = [str(i+1), name, f'{w} ({dw})', f'{l} ({dl})', f'{pct(w,l)} ({pct(dw,dl)})']
            for j, (xx, value) in enumerate(zip(columns, values)):
                text(xx, y, value, 29, '#172b44', j == 1, 'ra' if j >= 2 else None)
    total_w = sum(r['fallback_wins'] for r in rows)
    total_l = sum(r['fallback_losses'] for r in rows)
    unresolved = sum(r['unresolved'] for r in rows)
    notes = [
        'Sortering: databasens värden. Parentes = direkt MariaDB-uttag, 17 oktober 2026.',
        'Alla tävlingstyper. Completed + Aborted; inga walkover. Motståndarens ranking 1–10 vid matchen.',
        'Saknad matchrankning: PLAYER_RANK_AT_DATE vid turneringens startdatum, senaste kända ranking då.',
        f'Kompletteringen tillför {total_w} vinster och {total_l} förluster. Ranking saknas fortfarande i {unresolved} spelar–matchposter.',
        'Historisk ranking är en uppskattning. Bildens slutdatum är okänt. ”Doper*” tolkas som Sinner; Zverev behålls från bilden.',
    ]
    for i, note in enumerate(notes):
        text(65, 1910+i*43, note, 27, '#42566b')
    output = FOLDER / 'comparison-with-fallback.png'
    image.save(output)
    print(output)
    print(json.dumps({'added_wins': total_w, 'added_losses': total_l, 'unresolved': unresolved}))


if __name__ == '__main__':
    main()
