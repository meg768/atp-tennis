# Oddsinsamling

Enda aktiva implementationen är `node atp.js odds`, schemalagd på pi-kato i /home/pi/atp-tennis av root-PM2 atp-odds varje hel timme, autorestart=false. Manuella körningar använder samma kommando och MariaDB-lås, aldrig en andra scheduler. Python-insamlaren och dess likvärdiga tester är bevarade i det tidigare ATP Tennis Odds-arkivet; ingen collector.py aktiveras här.

Svenska Spels aktuella öppna matchvinnarodds får skapa/uppdatera en rad endast vid NOT_STARTED och verifierad framtida start. id är källans event-id; time är planerad start i UTC. event_name är källans turneringsnamn; event kopplar entydig upplaga till events.id. Båda spelar-id:n sparas oberoende av TA. TA beräknas före start med upplagans verifierade underlag och befintligt 5 procent sannolikhetspåslag. Live/stängda/saknade marknader lämnar priser orörda. Efter dygnsimporten kompletteras enbart saknade entydiga event-/spelar-id:n, även efter start; sparade priser och TA ändras aldrig retroaktivt.

Importer av sportdata körs fortsatt av befintliga atp-import kl. 06 på pi-kato. Alla befintliga PM2-scheman bevaras. Migrationsfiler 001–018 är historiska steg och ska inte köras om mot den befintliga databasen. database/schema.sql är struktur-bootstrap för en ny miljö och inkluderar bets samt MATCH_LOOKUP; det är ingen produktionsmigrering.
