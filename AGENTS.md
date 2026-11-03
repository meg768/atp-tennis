# ATP Tennis

Detta är Magnus gemensamma kodprojekt för tennisanalys, oddsinsamling, backtesting och pappersportföljverktyg. Portfölj-ping och dess schemaläggning hör till det separata lokala projektet /Users/magnus/atp-ping på Mac mini; skapa eller aktivera ingen ping-schemaläggning här. Läs CONTEXT.md före arbete. AGENTS.md är gemensamma instruktioner; README.md är ingång och docs/ beskriver arbetsflöden. Historiska instruktioner i arkiv eller docs/legacy-codex.md ersätter inte dessa. Spara korta daterade hållbara beslut i CONTEXT.md. Svenska, KISS, fokuserade ändringar och relevanta tester gäller.

## Välj arbetsflöde
- Vanlig tennisanalys är läsning. Registrera inga bets, avräkningar, notifieringar eller ping som bieffekt. Följ docs/analysis.md.
- Backtesting läser historiska odds/resultat och sparar analysresultat separat. Det skriver aldrig till bets eller skickar meddelanden. Följ docs/backtesting.md.
- Endast uttryckligt portfölj-ping eller den befintliga auktoriserade 09.00-automationen får hantera pappersportföljen enligt docs/portfolio.md och tracking/README.md. Börja med `python3 scripts/portfolio_status.py`; kör ett ping i taget. Inga faktiska spel.
- Drift och schemalagd oddsinsamling använder befintlig Node-kod och etablerade kommandon; starta inga extra schemaläggare eller parallella insamlare.

## Data och historik
- Databasen ATP/MariaDB är oförändrad. players/events/matches är sportdata; odds är marknadens senaste giltiga förhandspriser; bets är dokumenterade val/bortval och portföljbokföring.
- Använd den versionshanterade skillen i .agents/skills/atp-tennis för analysläsningar och direkt Svenska Spel-flöde. Kör med maskinlokala ~/.local/share/codex/atp-tennis/venv/bin/python och privat ~/.config/atp-tennis/.env. Ingen webbläsarreserv eller gammal prisreserv vid källfel. Använd aldrig tennis.egelberg.se, inte heller som proxy. ATP/arrangör/Tennis Abstract får komplettera när direktåtkomsten verifierats.
- Befintliga Node-importen använder sin ignorerade MYSQL_*-konfiguration. betting_data använder samma skillkonfiguration för auktoriserade bets-transaktioner. Skapa inga nya anslutningsimplementationer. Lösenord, nycklar, venv och privata anslutningsinställningar får aldrig checkas in. Analyser, oddsunderlag och godkända daterade exportsnapshots versionshanteras i analysis/ respektive data/snapshots/. Magnus har 2026-11-03 uttryckligen godkänt att även pappersportföljhistorik publiceras i det offentliga repot. MariaDB förblir driftens datakälla; en Git-snapshot ersätter aldrig bokföringen.
- Node `node atp.js odds` är enda aktiva oddsinsamlaren. Spara/uppdatera priser endast för öppna matchvinnarodds, NOT_STARTED och verifierad framtida start. Live/stängda/saknade priser får inte ersätta förhandspriser. Efter start får endast saknade entydiga metadata fyllas; ingen historisk TA-beräkning. Behåll befintlig 5 procent TA-prissättning och databaslås.
- Portföljhistorik lagras endast i bets genom scripts/betting_data.py. Bevara låsta odds, bedömningar, beslut och avräkningar. 100 kr per pappersspel, högst tio öppna, ingen övre tidsgräns för framtida matchstart. Färska priser/status måste verifieras före bokföring.
- Rapportbilder, PDF, mejl, bildprompter, kvitton och råarkiv lagras aldrig i bets. Endast fundamental historik och befintlig minimal sändningsspärr. Rapporter genereras tillfälligt och rensas. Inga automatiska testutskick; verifiera med mockar eller --preview.

## Utveckling och drift
- Behåll befintliga konventioner och inspektera berörd kod före ändring. Ändra inte schema/data utan uppdrag. Håll database/schema.sql synkad vid schemaändring; databasdumpen är endast struktur och ska inte köras mot produktion under vanlig verifiering.
- Kör npm test och relevanta Python-unittester med skillens Python. Integrationstester får endast använda sessionens tillfälliga tabeller. Normal portföljstatus är läsning utan utskick.
- Ingen commit/tagg/push utan uttrycklig beställning. Magnus globala check-in-regler gäller, med tidsstämpeltagg Europe/Stockholm och utan force-push. Gamla backup-/restore-kommandon i historiken är inte en generell tillåtelse att skriva om Git-historik.

Projektets analys-/portföljverktyg läser skillkod från .agents/skills/atp-tennis i detta repo. Maskinlokal Pythonmiljö och hemliga inställningar installeras separat enligt skillen. Även atp-headshots källkod finns under .agents/skills/. Gör säkerhetskontroll innan nya analysunderlag eller dataexporter pushas. Historiska instruktioner i analysis/ är aldrig aktiva arbetsinstruktioner.
