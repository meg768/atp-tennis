# Odds Helpers

Den här katalogen samlar oddsrelaterade helper-script och framtida delfaktorer.

Tanken är att `compute-odds.js` kan växa vidare här tillsammans med fler moduler,
frågor och faktorer som sedan vägs samman till en slutlig oddsmodell.

Nuvarande script:

- `compute-odds.js` - kör query-baserad summering och visar enkel head-to-head

Nuvarande struktur:

- `compute-odds.js` - huvudscriptet
- `queries/` - separata SQL-filer som utser vinnare och bidrar med vikt
- `queries/elo.sql` - query för total ELO
- `queries/head-to-head.sql` - query för head-to-head

Exempel:

```bash
./helpers/odds/compute-odds.js
./helpers/odds/compute-odds.js "Jannik Sinner" Alcaraz
```

Just nu visas två parallella saker:

- en experimentell faktorscore summerad från alla SQL-filer i `queries/`
- en textsummering baserad på query-resultaten

Kontrakt för SQL-filer i `queries/`:

- varje fil ska vara en `.sql`-fil
- varje fil ska börja med ett metadata-block:
  - `/*`
  - `@name ...`
  - `@description ...`
  - `@weight ...`
  - `*/`
- alla `@`-taggar kan fortsätta över flera rader fram till nästa `@`-tagg
- varje fil ska returnera exakt en rad
- raden ska minst innehålla:
  - `winner` som `A`, `B` eller `null`
- raden får också innehålla:
  - `title`
  - `summary`

Metadata tolkas av `compute-odds.js` och används som standard för:

- queryns namn
- queryns beskrivning
- queryns vikt

Det gör att vi senare kan läsa, ändra eller generera SQL-filer utifrån metadatahuvudet.

Tillgängliga SQL-variabler:

- `@playerA` - playerA:s spelar-id
- `@playerB` - playerB:s spelar-id

Varje SQL-fil bör börja med:

```sql
SET @playerA = :playerA;
SET @playerB = :playerB;
```

`compute-odds.js` ersätter sedan `:playerA` och `:playerB` med riktiga spelar-id innan queryn körs.

All annan information ska SQL-filen själv läsa fram från databasen utifrån dessa två id:n.

Viktigt:

- `compute-odds.js` räknar inte längre ut odds själv i JavaScript
- om odds ska visas senare måste de härledas från query-systemet

## Arbetsminne

Nuvarande riktning för lekstugan:

- allt ska hållas isolerat under `helpers/odds/`
- `queries/` innehåller bara SQL-filer
- varje SQL-fil har metadata i ett `/* ... */`-block med:
  - `@name`
  - `@description`
  - `@weight`
- metadata-taggar kan fortsätta över flera rader
- varje SQL-fil börjar med:

```sql
SET @playerA = :playerA;
SET @playerB = :playerB;
```

- `compute-odds.js` ersätter sedan `:playerA` och `:playerB` med riktiga spelar-id
- själva SQL-logiken använder därefter `@playerA` och `@playerB`
- query-resultat returnerar just nu minst:
  - `winner` som `A`, `B` eller `NULL`
- debug-utskriften visar just nu:
  - querynamn
  - vinnarnamn
  - vikt i procent
- slutraden visar just nu bara en enkel oddsrad byggd från den summerade query-poängen

Öppna frågor till nästa gång:

- `winner = A/B/NULL` känns troligen för grovt för vissa queries
- ELO är ett tydligt exempel där storleken på skillnaden borde påverka utfallet, inte bara riktningen
- möjlig framtida riktning:
  - låta varje query returnera något starkare än bara `winner`, till exempel ett styrkevärde eller en edge
- ingen slutlig modell är bestämd ännu
- detta är fortfarande en lekstuga och formatet får gärna ändras
