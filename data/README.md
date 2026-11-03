# Daterade dataexporter

snapshots/ innehåller läsande, komprimerade ögonblicksbilder av players, events, matches, odds och bets från befintlig ATP/MariaDB. Magnus har uttryckligen godkänt offentlig publicering av analys- och pappersportföljhistorik i detta repo 2026-11-03.

Skapa en ny snapshot från repo-roten med:

```sh
~/.local/share/codex/atp-tennis/venv/bin/python scripts/export_project_snapshot.py
```

Exporten kör en read-only-transaktion med konsekvent snapshot, inkluderar aldrig settings/log eller anslutningsinställningar och ändrar inga produktionsdata. Varje snapshot har manifest.json med radantal, filstorlek och SHA-256. JSONL-filerna är gzip-komprimerade; datum och decimaler lagras som strängar. Lägg aldrig hemligheter i dessa data. Granska och kontrollera exporten innan den checkas in och pushas.

Snapshoten är statisk vid angiven uttagstid. MariaDB är fortsatt datakälla för aktuell analys och all löpande bokföring. Ingen automatisk återställning eller portföljreserv från Git-filer görs. Varken bokförda spel, avräkningar eller notifieringar skapas av exporten. Framtida databasändringar finns i GitHub först efter en ny export och check-in.
