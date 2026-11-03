from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent
rows=[('Alexander Zverev',8850),('Jannik Sinner',7950),('Carlos Alcaraz',4600),('Ben Shelton',4480),('Flavio Cobolli',3540),('Frances Tiafoe',3380),('Arthur Fils',3325),('Daniil Medvedev',3120),('Novak Djokovic',2840),('Alex de Minaur',2780)]
(p/'results.json').write_text(json.dumps({'source':'https://tennis-db.com/seasons-and-rankings?view=race','standings_date':'2026-10-12','retrieved_date':'2026-10-19','rows':[{'name':n,'race_points':v} for n,v in rows]},ensure_ascii=False,indent=2))
im=Image.new('RGB',(1000,765),'#f5f8f9');d=ImageDraw.Draw(im)
def font(n,b=False):return ImageFont.truetype('/System/Library/Fonts/Supplemental/'+('Arial Bold.ttf' if b else 'Arial.ttf'),n)
def t(x,y,s,n=20,b=False,c='#193341',right=False):
 if right:x-=d.textlength(s,font=font(n,b))
 box=d.textbbox((x,y),s,font=font(n,b));assert box[2]<990 and box[3]<765,(s,box)
 d.text((x,y),s,font=font(n,b),fill=c)
def num(n):return f'{n:,}'.replace(',',' ')
d.rectangle((0,0,1000,86),fill='#153746')
t(18,10,'Flest ATP-poäng under 2026',29,True,'white')
t(18,52,'Herrsingel • ATP Race • ställning 12 oktober 2026',20,c='#d7e8ec')
d.rectangle((10,96,990,130),fill='#fff0d5')
t(18,102,'EXTERN KÄLLA: TennisDB • Race-poäng finns inte i projektets databas',18,True)
for x,s in [(18,'#'),(60,'Spelare'),(735,'Race-poäng'),(980,'Efter ledaren')]:t(x,145,s,20,True,right=x>60)
for i,(name,points) in enumerate(rows):
 y=180+i*29
 d.rectangle((10,y-3,990,y+25),fill='#d5eee7' if i==0 else ('#eaf0f3' if i%2==0 else '#f5f8f9'))
 t(18,y,str(i+1));t(60,y,name,21,i==0);t(735,y,num(points),21,True,right=True);t(980,y,'—' if i==0 else '−'+num(8850-points),20,right=True)
t(18,487,'ZVEREV LEDER ÅRSRACET',21,True)
t(18,517,'Zverev ligger 900 poäng före Sinner i denna ögonblicksbild.',19)
t(18,541,'Race visar säsongens räknade poäng; den vanliga rankingen kan även innehålla fjolårspoäng.',18)
t(18,583,'KÄLLA OCH BEGRÄNSNING',20,True)
t(18,612,'Alla placeringar och Race-poäng ovan kommer från TennisDB, inte från projektets databas.',17)
t(18,634,'Listan gäller 12 oktober. Den är inte verifierad som dagens ställning den 19 oktober.',17)
t(18,656,'ATP:s officiella Race-sida gick inte att läsa vid kontrollen. Ingen egen poängberäkning har gjorts.',17)
t(18,692,'ÅTERSKAPA • ATP-20261019-02',19,True)
t(18,719,'2026, herrsingel, Race-listans tio första; källans ordning. Källdatum och resultat sparade.',17)
t(18,743,'tennis-db.com/seasons-and-rankings?view=race • hämtad 19 oktober 2026',16,c='#526b78')
im.save(p/'atp-race-2026.png')
