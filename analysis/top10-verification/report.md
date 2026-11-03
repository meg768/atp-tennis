# Kontroll av bilden mot tennisdatabasen

Kontrollerat 2026-10-13 via https://tennis.egelberg.se/api/query.

Definition: motståndaren rankad 1–10 i matchens winner_rank/loser_rank; Completed och Aborted inkluderas; Walkover och Unknown samt Challenger och Rod Laver Cup exkluderas. Övriga eventtyper inkluderas. Rankning avser motståndaren vid matchen enligt databasens fält, inte dennes bästa karriärrankning.

Databasen har 29 spelare med highest_rank=1. Bilden saknar Jannik Sinner och inkluderar Alexander Zverev (highest_rank=2) och Jack Draper (highest_rank=4). Inga av bildens 30 W–L-par matchar exakt med denna definition.

Siffrorna nedan är databasresultat, inte verifierade kompletta karriärfacit. Saknade motståndarrankningar och varierande matchtäckning hindrar fullständig bekräftelse. Eventdatum är turneringsdatum, inte exakta matchdatum.

| Spelare | Bild W–L | Databas W–L | Databas vinstprocent | Bästa rankning |
|---|---:|---:|---:|---:|
| Novak Djokovic | 269–122 | 262–116 | 69.3% | 1 |
| Roger Federer | 224–123 | 206–121 | 63.0% | 1 |
| Rafael Nadal | 186–105 | 181–104 | 63.5% | 1 |
| Ivan Lendl | 166–92 | 134–80 | 62.6% | 1 |
| Jimmy Connors | 127–109 | 113–93 | 54.9% | 1 |
| John McEnroe | 128–94 | 107–77 | 58.2% | 1 |
| Andy Murray | 105–96 | 104–96 | 52.0% | 1 |
| Bjorn Borg | 113–46 | 95–41 | 69.9% | 1 |
| Pete Sampras | 124–71 | 88–48 | 64.7% | 1 |
| Andre Agassi | 109–90 | 84–70 | 54.5% | 1 |
| Boris Becker | 121–65 | 79–58 | 57.7% | 1 |
| Stefan Edberg | 98–114 | 74–91 | 44.8% | 1 |
| Jannik Sinner | Saknas | 67–37 | 64.4% | 1 |
| Alexander Zverev | 60–88 | 58–79 | 42.3% | 2 |
| Carlos Alcaraz | 56–26 | 54–25 | 68.4% | 1 |
| Mats Wilander | 62–67 | 50–50 | 50.0% | 1 |
| Daniil Medvedev | 52–55 | 48–53 | 47.5% | 1 |
| Lleyton Hewitt | 65–73 | 46–65 | 41.4% | 1 |
| Jim Courier | 53–73 | 45–62 | 42.1% | 1 |
| Marat Safin | 49–50 | 41–39 | 51.2% | 1 |
| Juan Carlos Ferrero | 41–61 | 35–54 | 39.3% | 1 |
| Ilie Nastase | 48–69 | 33–55 | 37.5% | 1 |
| Andy Roddick | 37–73 | 32–64 | 33.3% | 1 |
| Carlos Moya | 44–60 | 32–49 | 39.5% | 1 |
| Gustavo Kuerten | 38–36 | 31–29 | 51.7% | 1 |
| Thomas Muster | 37–51 | 31–40 | 43.7% | 1 |
| Yevgeny Kafelnikov | 46–67 | 31–47 | 39.7% | 1 |
| Patrick Rafter | 35–49 | 29–42 | 40.8% | 1 |
| Marcelo Rios | 22–39 | 22–36 | 37.9% | 1 |
| John Newcombe | 21–27 | 13–18 | 41.9% | 1 |
| Jack Draper | 69–37 | 9–16 | 36.0% | 4 |

Rios (37,9%) och Roddick (33,3%) är de enda av databasens 29 världsettor som ligger under 40% med detta urval. Djokovic har flest vinster (262), Borg högst andel (69,9%). Påståendet att Becker är underskattad är en värdering.

Reproducerbar SQL finns i query.sql, råresultat i raw.json, sammanställning i summary.json och täckningskontroll i coverage.json.
