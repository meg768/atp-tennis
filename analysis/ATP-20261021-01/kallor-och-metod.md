# Spelval 21 oktober 2026

Uttag 21 oktober kl. 01.15 Europe/Stockholm. Tre subjektivt prioriterade matchvinnare bland 15 kommande ATP-singelmatcher den 21 oktober i [Oddset-flödet](https://tennis.egelberg.se/api/oddset). Urvalet väger TA-gap mot form och fysisk osäkerhet och är inte en rangordning efter största modellgap. Prioritering: Cerundolo, Darderi, Fearnley. Tidigare granskade Goffin, Wawrinka och Moutet väljs bort av samma skäl som i föregående analys.

Direkt MariaDB: `CALL PLAYER_ODDS(player, opponent, 'Hard')`. TA-oddsen innehåller redan databasens standardpåslag: `ROUND(1 / clamp(p * 1.05, 0.001, 0.999), 2)`. Varken ytterligare påslag eller anpassning till Svenska Spels exakta överrundning görs.

Cerundolo–Damm ger tomt resultat från proceduren eftersom Damms lokala Elo saknas. Komplettering från [TA:s aktuella Elo-lista](https://tennisabstract.com/reports/atp_elo_ratings.html), daterad 19 oktober: hElo Cerundolo 1839,9 och Damm 1635,9. `p = 1 / (1 + 10 ** ((1635.9 - 1839.9) / 400))`; samma 5-procentpåslag ger TA 1,25 för Cerundolo. Databasen har inte ändrats.

Färska Brysselresultat kontrollerade mot [TennisActu](https://www.tennisactu.net/news-atp-bruxelles-hugo-gaston-coince-d-entree-contre-jacob-fearnley-127725.html): Fearnley–Gaston 6–3, 6–0; Chidekh–van de Zandschulp 6–1, 6–4. Dessa matcher saknades ännu i den lokala historiken vid kontrollen. Damm–Hanfmann 7–5, 6–3 finns i databasen. Övrig formbakgrund sparades i `analysis/ATP-20261020-01/`.

Jämförelse: Cerundolo SS 1,53 / TA 1,25; Darderi SS 1,78 / TA 1,49; Fearnley SS 1,91 / TA 1,63. Oddsgap från dessa avrundade priser: 22,4 %, 19,5 %, 17,2 %. Formeln är `(SS / TA - 1) * 100`; detta är en prisskillnad och inte modellens förväntade avkastning.

Tider från flödet omräknade till svensk tid, preliminära. Rådata och procedurresultat: `oddset.json` och `picks.json`. Planschen är skapad med det inbyggda imagegen-verktyget; full prompt finns i `plansch-prompt.txt`.
