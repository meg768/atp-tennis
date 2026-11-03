import json
from pathlib import Path
from collections import Counter,defaultdict
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent;data=json.loads((p/'results.json').read_text());a=defaultdict(Counter)
for r in data:a[r['name']][r['type']]+=1
rows=sorted([(n,c) for n,c in a.items() if c.total()>=2],key=lambda v:(-v[1].total(),v[0]))
im=Image.new('RGB',(1080,755),'#f5f8f9');d=ImageDraw.Draw(im)
def f(n,b=False):return ImageFont.truetype('/System/Library/Fonts/Supplemental/'+('Arial Bold.ttf' if b else 'Arial.ttf'),n)
def t(x,y,s,n=20,b=False,c='#193341',right=False):
 if right:x-=d.textlength(s,font=f(n,b))
 box=d.textbbox((x,y),s,font=f(n,b));assert box[2]<1070 and box[3]<755,(s,box)
 d.text((x,y),s,font=f(n,b),fill=c)
d.rectangle((0,0,1080,86),fill='#153746')
t(18,10,'Flest titlar 2026: Jannik Sinner med 6',29,True,'white')
t(18,52,'Herrsingel • ATP-touren och Grand Slam • databasläget 19 oktober 2026',20,c='#d7e8ec')
for x,s in [(18,'Plats'),(90,'Spelare'),(600,'GS'),(735,'Masters'),(850,'ATP 500'),(962,'ATP 250'),(1060,'Totalt')]:t(x,105,s,19,True,right=x>=600)
previous=None;place=0
for i,(name,c) in enumerate(rows):
 if c.total()!=previous:place=i+1
 previous=c.total();y=141+i*31
 d.rectangle((10,y-3,1070,y+26),fill='#d5eee7' if i==0 else ('#eaf0f3' if i%2==0 else '#f5f8f9'))
 t(18,y,str(place));t(90,y,name,21,i==0)
 for x,typ in [(600,'Grand Slam'),(735,'Masters'),(850,'ATP-500'),(962,'ATP-250')]:t(x,y,str(c[typ]),21,right=True)
 t(1060,y,str(c.total()),21,True,'#12695f',True)
t(18,437,'Alla nio spelare med minst två titlar visas. Lika antal titlar ger delad placering.',18,c='#526b78')
t(18,478,'SINNERS SEX TITLAR ÄR ALLA PÅ HÖGSTA TURNERINGSNIVÅERNA',20,True)
t(18,508,'Fem Masters: Indian Wells, Miami, Monte-Carlo, Madrid och Rom. Därtill Wimbledon.',19)
t(18,533,'Shelton är tvåa med fyra. Zverev har två titlar, men båda är Grand Slams: Roland Garros och US Open.',18)
t(18,558,'Antal titlar och antal rankingpoäng mäter därför olika saker: här väger varje titel lika tungt.',18)
t(18,601,'KÄLLA OCH URVALSREGLER',20,True)
for i,s in enumerate([
'Källa: tennis.egelberg.se-databasen. Herrsingel; turneringsstart 1 jan–19 okt 2026.',
'Räkna finaler (F) där vinnare finns och status är Completed, Aborted eller Walkover.',
'Typer: Grand Slam, Masters, ATP-500, ATP-250, World Championship (ATP Finals; inga titlar ännu).',
'Gruppera per spelare; visa minst två titlar. Sortera antal fallande, sedan namn alfabetiskt vid lika antal.',
'Challenger, dubbel och lagtitlar ingår inte. Resultatet bygger på registrerade finaler vid uttaget.'
]):t(18,631+i*20,s,17)
t(18,735,'Direkt SQL • 19 oktober 2026 • sparat underlag: ATP-20261019-03',16,c='#526b78')
im.save(p/'flest-titlar-2026.png')
