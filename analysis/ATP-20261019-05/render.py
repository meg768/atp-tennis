from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
p=Path(__file__).resolve().parent;players=json.loads((p/'players.json').read_text())
im=Image.new('RGB',(1180,1055),'#fafbf9');d=ImageDraw.Draw(im)
def f(n,b=False):return ImageFont.truetype('/System/Library/Fonts/Supplemental/'+('Arial Bold.ttf' if b else 'Arial.ttf'),n)
def t(x,y,s,n=21,b=False,c='#183c42',right=False):
 if right:x-=d.textlength(s,font=f(n,b))
 box=d.textbbox((x,y),s,font=f(n,b));assert box[2]<=1164 and box[3]<1055,(s,box)
 d.text((x,y),s,font=f(n,b),fill=c)
t(24,17,'Danmarks tennisprofiler genom tiderna',35,True)
t(24,71,'Wozniacki har den tyngsta samlade meritlistan. Rune leder den moderna herrsingeln.',22)
d.rectangle((18,117,1162,216),fill='#e0efe9')
t(34,130,'Caroline Wozniacki',26,True);t(34,170,'30 WTA-titlar • 71 veckor som världsetta • Australian Open 2018',23)
t(1146,136,'Extern källa: WTA',17,c='#587174',right=True)
t(24,242,'Herrsingel: toppnamnen i databasen',24,True)
t(24,278,'Samtliga danskar med registrerad bästa ATP-ranking inom topp 100, sorterade efter bästa ranking.',18,c='#587174')
for x,s in [(24,'Spelare'),(520,'Bäst rank'),(700,'Singeltitlar¹'),(970,'Vinster–förluster')]:t(x,317,s,20,True,right=x>24)
rs=[r for r in players if r['highest_rank'] and r['highest_rank']<=100]
for i,r in enumerate(rs):
 y=353+i*37
 if i%2==0:d.rectangle((18,y-4,1162,y+30),fill='#eef3ef')
 t(24,y,r['name'],22,i==0);t(520,y,str(r['highest_rank']),22,True,right=True);t(700,y,str(r['career_titles']),22,right=True)
 t(970,y,f"{r['career_wins']}–{r['career_losses']}",22,right=True)
t(24,553,'Rune: fem titlar, däribland Paris Masters 2022. Carlsen: tre titlar och flest matchvinster i tabellen.',19)
t(24,580,'Carlsens titlar: Hongkong 1998, Tokyo 2002 och Memphis 2005. Pless och Fetterlein nådde topp 75.',19)
d.line((24,619,1156,619),fill='#bdcdc8')
t(24,636,'Historien som en ATP-singeltabell inte fångar',24,True)
extras=[
('Kurt Nielsen','Wimbledonfinalist i singel 1953 och 1955. Vann US Championships i mixed 1957.','Extern: ATP Tour'),
('Frederik Nielsen','Vann Wimbledon i herrdubbel 2012 med Jonathan Marray. Kurt Nielsens sonson.','Extern: ATP Tour'),
('Clara Tauson','WTA-titlar i Lyon och Luxemburg 2021 samt Auckland 2025; finalist i Dubai 2025.','Extern: WTA'),
]
for i,(name,desc,source) in enumerate(extras):
 y=682+i*71
 t(24,y,name,22,True);t(1156,y,source,16,c='#587174',right=True);t(24,y+29,desc,19)
d.line((24,907,1156,907),fill='#bdcdc8')
for i,s in enumerate([
'Min tolkning: Wozniacki är främsta totalnamnet; Rune har högsta ATP-singelranking i databasen.',
'¹ Tabellen använder spelarprofilernas singeltitlar och matchfacit. Torben Ulrichs äldre karriär täcks bara delvis.',
'Källor: tennis.egelberg.se via direkt SQL. Externa fakta är märkta per avsnitt: WTA-spelarprofiler och ATP Tour.',
'Ingen gemensam poängrankning mellan dam-, herr- och dubbeltennis. Urvalet lyfter olika slags framgång.',
'Uttag och källkontroll: 19 oktober 2026 • sparat underlag och externa källänkar: ATP-20261019-05.'
]):t(24,927+i*23,s,17,c='#587174')
im.save(p/'danska-tennisprofiler.png')
