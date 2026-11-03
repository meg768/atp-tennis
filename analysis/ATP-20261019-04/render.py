from pathlib import Path
from collections import defaultdict
from PIL import Image,ImageDraw,ImageFont
import json,textwrap
P=Path(__file__).resolve().parent;raw=json.loads((P/'matches.json').read_text());g=defaultdict(list)
for m in raw:g[m['name']].append(m)
W,H=1420,1370
im=Image.new('RGB',(W,H),'#fafbf9');d=ImageDraw.Draw(im)
ink='#183c42';muted='#587174';green='#087e73';red='#b44f48';amber='#98723c'
def f(n,b=False):return ImageFont.truetype('/System/Library/Fonts/Supplemental/'+('Arial Bold.ttf' if b else 'Arial.ttf'),n)
def t(x,y,s,n=21,b=False,c=ink,right=False):
 if right:x-=d.textlength(s,font=f(n,b))
 box=d.textbbox((x,y),s,font=f(n,b));assert box[2]<=W-15 and box[3]<H,(s,box)
 d.text((x,y),s,font=f(n,b),fill=c)
def para(x,y,s,width,n=19,c=ink):
 words=s.split();line='';yy=y
 for word in words:
  cand=(line+' '+word).strip()
  if d.textlength(cand,font=f(n))>width:t(x,yy,line,n,c=c);yy+=25;line=word
  else:line=cand
 if line:t(x,yy,line,n,c=c)
 return yy+25
labels=['Äldre matchdata','Stark form','Stark form','Bra nivå','Tappat fart','Stark form','Tre raka förluster','Starkt mot toppen','Bra nivå','Bra nivå','Starkt mot toppen','Tappat fart','Ojämnt','På väg upp','Jämnt','Bra nivå','Ojämnt','Jämnt','Tappat fart','Jämnt']
t(24,17,'Formläget i topp 20',39,True)
t(24,72,'Zverev, Alcaraz och Medvedev håller hög nivå. Cobollis senaste trend pekar nedåt.',23)
t(24,112,'19 oktober 2026 • herrsingel • senaste 20 spelade tourmatcher per spelare',19,c=muted)
for x,s in [(24,'#'),(65,'Spelare'),(435,'Förra 10'),(565,'Senaste 10'),(626,'Formkurva¹'),(1000,'Mot topp 20²'),(1045,'Bedömning')]:t(x,163,s,19,True,right=x in (435,565,1000))
t(626,187,'Äldre → nyare • 0–100 %',15,c=muted)
for i,(name,ms) in enumerate(g.items()):
 y=216+i*37
 latest=ms[-10:];old=ms[:10];wins=sum(m['win'] for m in latest);ow=sum(m['win'] for m in old)
 label=labels[i];col=amber if i==0 else red if label in ('Tre raka förluster','Tappat fart') else green if label in ('Stark form','Starkt mot toppen','På väg upp') else muted
 if i%2==0:d.rectangle((16,y-3,W-16,y+32),fill='#eff3f0')
 if label=='Tre raka förluster':d.rectangle((16,y-3,W-16,y+32),fill='#f8eae6')
 t(24,y,str(ms[0]['rank']),20,c=muted);t(65,y,name,22,i==0)
 t(435,y,f'{ow}–{10-ow}',21,c=muted,right=True);t(565,y,f'{wins}–{10-wins}',22,True,right=True)
 values=[sum(z['win'] for z in ms[j-4:j+1])/5 for j in range(4,20)]
 x0,x1=628,847;yt,yb=y+2,y+27
 d.line((x0,(yt+yb)/2,x1,(yt+yb)/2),fill='#d2ddd8',width=1)
 pts=[(x0+j*(x1-x0)/15,yb-v*(yb-yt)) for j,v in enumerate(values)]
 d.line(pts,fill=col,width=3);x,yy=pts[-1];d.ellipse((x-3,yy-3,x+3,yy+3),fill=col)
 top=[z for z in latest if z['opponent_rank'] and 1<=z['opponent_rank']<=20];tw=sum(z['win'] for z in top);missing=sum(not z['opponent_rank'] for z in latest)
 val=f'{tw}–{len(top)-tw}' if top else '—'
 if missing:val+='*'
 t(1000,y,val,21,right=True);t(1045,y,label,20,c=col)
d.line((24,968,W-24,968),fill='#bdcdc8',width=2)
for x,title,body,c in [
(24,'Stark form, olika motstånd','Zverev, Alcaraz och Medvedev har 8–2. Djokovic har 6–4 totalt men 4–1 mot kända topp 20-motståndare; Fils har 3–1. Det ger mer sammanhang än enbart vinstprocent.',green),
(495,'Varningssignaler','Cobolli har förlorat tre raka, mot rankade 34, 84 och 83. Fritz har gått från 8–2 till 6–4; samtliga fyra förluster i senaste blocket är mot spelare utanför topp 20.',red),
(962,'Sinner går inte att bedöma nu','9–1 ser starkt ut, men senaste registrerade turneringen är Wimbledon (start 29 juni). Övrigas senaste är Shanghai (start 5 oktober). Inaktivitet är inte samma sak som svag form.',amber)]:
 t(x,986,title,23,True,c);para(x,1025,body,430,19)
d.line((24,1160,W-24,1160),fill='#bdcdc8')
lines=[
'¹ Kurvan visar rullande vinstprocent över fem matcher, beräknad från de senaste 20. Samma skala i alla rader.',
'² Facit mot motståndare rankade 1–20 vid matchen, inom senaste 10. * Ranking saknas i någon match; 31 av 200 poster totalt.',
'Urval: profilranking 1–20 vid uttaget. Grand Slam, Masters, ATP 500/250 och ATP Finals; Completed/Aborted, inga kval eller walkover.',
'Ordning: turneringsstart, därefter omgång, sist match-ID. Period: från 1 jan 2025 till 19 okt 2026; senaste 20 per spelare.',
'Formomdömena är min tolkning av resultaten, inte en prognos. Olika tidsperioder, motstånd och underlag gör jämförelsen ungefärlig.',
'Källa: endast tennis.egelberg.se-databasen • direkt SQL • 19 oktober 2026 • sparad fråga och resultat: ATP-20261019-04.'
]
for i,s in enumerate(lines):t(24,1177+i*29,s,18,c=muted)
im.save(P/'topp20-form.png')
