# Oddset jämfört med TA, 5 november 2026

Oddset och TA skiljer sig i genomsnitt med **6,22 procentenheter per match** efter att respektive oddssumma normaliserats. De valde olika favoriter i **7 av 74 matcher** där båda hade en entydig favorit.

## Underlag

Läsande uttag från ATP/MariaDB-tabellen `odds` den 5 november 2026 kl. 23.57.41 svensk tid. Samtliga 81 sparade rader granskades, med starttider från 29 oktober till 6 november. Fem rader saknade TA på båda sidor och utelämnades. Kvar fanns 76 matcher med kompletta positiva odds, varav 51 i Paris, 13 i Wien och 12 i Basel. Inget resultatfilter användes. Underlaget består av sparade förhandspriser, inklusive kommande matcher och ursprungliga matchpar som senare ändrades. [SQL-fråga](query.sql) · [Uttag sorterat efter starttid i UTC och odds-id](source.json)

## Spridning

| Mått | Oddset | TA |
| --- | ---: | ---: |
| Medianodds | 1,90 | 1,90 |
| Genomsnittligt odds | 2,30 | 2,50 |
| Populationsvarians för odds | 1,31 | 2,79 |
| Standardavvikelse för odds | 1,15 | 1,67 |
| Genomsnittlig överround | 5,33 % | 5,00 % |

Varje kolumn ovan innehåller båda sidorna i varje match, totalt 152 odds. Den parade differensen Oddset minus TA har populationsvarians 0,65, standardavvikelse 0,81 och en median för absolut differens på 0,205 odds. Överround är summan av de två inversa oddsen minus ett. Skillnaden i genomsnittlig överround är cirka 0,33 procentenheter.

För jämförelsen av vinstchanser divideras varje sidas inversa odds med summan av båda sidornas inversa odds, separat för Oddset och TA. Första spelarens absoluta differens används per match eftersom båda sidors differenser då är lika stora. Medelvärdet är 6,22 procentenheter och medianen 5,16. I 20 av 76 matcher är skillnaden minst 10 procentenheter. Den största skillnaden är 16,06 procentenheter för Quentin Halys mot Frances Tiafoe. Oddset motsvarar där 43,5 % för Halys och TA 27,5 % efter normalisering.

Av de 76 matcherna hade 67 samma favorit, sju motsatt favorit och två lika odds i en av kolumnerna. Shelton–Paul är ett exempel på motsatt favorit. De normaliserade priserna motsvarar 44,8 % för Shelton hos Oddset och 54,3 % hos TA. Vinstchanserna här är härledda ur de sparade oddsen.
