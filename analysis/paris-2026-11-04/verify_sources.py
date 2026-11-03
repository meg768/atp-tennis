import json,re,urllib.request
from pathlib import Path
folder=Path(__file__).parent
sources={
'fft-tuesday':'https://www.fft.fr/actualites/rolex-paris-masters-halys-rinderknech-kouame-gea-bonzi-resultats-programme-tableau',
'djokovic-tuesday':'https://www.rolexparismasters.com/en/news/video/highlights-novak-djokovic-success-valentin-vacherot-first-round',
'borges-tuesday':'https://comiteolimpicoportugal.pt/configuracoes/lista-de-noticias/portugueses-com-sortes-diferentes-no-quadro-principal-do-masters-1000/'}
for name,url in sources.items():
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=12) as response:html=response.read().decode('utf8',errors='replace');status=response.status
  (folder/(name+'.html')).write_text(html)
  plain=re.sub('<[^>]+>',' ',html);plain=re.sub(r'\s+',' ',plain)
  patterns=('abdomin','2h35','6-3','6/3','Borges','Tiafoe')
  snippets=[plain[max(0,m.start()-150):m.start()+350] for token in patterns for m in list(re.finditer(re.escape(token),plain,re.I))[:2]]
  print(json.dumps({'name':name,'status':status,'url':url,'snippets':snippets},ensure_ascii=False))
 except Exception as error:print(json.dumps({'name':name,'error':type(error).__name__}))
