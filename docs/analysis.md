# Tennisanalys

Läs data med atp-tennis-skillen. Statistikfrågor registrerar inga spel och skickar inga meddelanden. Spara källa, uttagstid, population, statusfilter, beräkning och sortering. Skilj fakta, modell och egen bedömning. Ranking vid turneringsstart är en daterad observation/uppskattning, inte en komplett veckohistorik; event.date är turneringens startdag, inte matchens speldag. Namn måste lösas till entydiga ATP-id:n.

`scripts/build_top10_comparison.py` och `scripts/render_top10_comparison.py` är flyttade oförändrade. De använder historiska underlag under den versionshanterade analysis-katalogen. Befintliga kopierade analyser och originalbilder bevaras här; de tidigare iCloud-mapparna har avvecklats. Lägg inte nya databasanslutningar eller hemligheter i analysverktygen.

Bildrenderaren använder lokal ignorerad .venv: `python3 -m venv .venv`, `.venv/bin/python -m pip install -r requirements-analysis.txt`, `.venv/bin/python -m scripts.render_top10_comparison`. Databasverktyget körs fortsatt med skillens Python.
