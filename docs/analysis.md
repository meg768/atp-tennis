# Tennisanalys

Läs data med atp-tennis-skillen. Statistikfrågor registrerar inga spel och skickar inga meddelanden. Spara källa, uttagstid, population, statusfilter, beräkning och sortering. Skilj fakta, modell och egen bedömning. Ranking vid turneringsstart är en daterad observation/uppskattning, inte en komplett veckohistorik; event.date är turneringens startdag, inte matchens speldag. Namn måste lösas till entydiga ATP-id:n.

`scripts/build_top10_comparison.py` och `scripts/render_top10_comparison.py` är flyttade oförändrade. De använder historiska underlag under den versionshanterade analysis-katalogen. Befintliga kopierade analyser och originalbilder bevaras här; de tidigare iCloud-mapparna har avvecklats. Lägg inte nya databasanslutningar eller hemligheter i analysverktygen.

Bildrenderaren använder lokal ignorerad .venv: `python3 -m venv .venv`, `.venv/bin/python -m pip install -r requirements-analysis.txt`, `.venv/bin/python -m scripts.render_top10_comparison`. Databasverktyget körs fortsatt med skillens Python.

## Dagligt analysmejl

Uppgiften ”Skicka dagens ATP-analys” finns under Schemalagt i ChatGPT på Mac mini och körs lokalt i atp-tennis varje dag kl. 08.15 svensk tid. Den granskar öppna ATP-singlar med framtida start inom 24 timmar och kontrollerar matchstatus och priser före utskick.

Apple Mail använder den lokala `~/.config/atp-tennis/analysis_email_recipients.json`. `scripts/send_analysis_mail.py` är installerat i `~/.local/share/atp-analysis-mail/` på Mac mini. `--preview` kontrollerar listan och åtkomsten till Apple Mail. `--send` tar emot JSON med dagens svenska datum (`date`) och mejltexten (`body`) via standard input. En datumspärr förhindrar dubbla utskick.
