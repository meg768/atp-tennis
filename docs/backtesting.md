# Backtesting

Backtesting är ett separat läsande analysflöde. Läs odds och matchresultat, välj uttryckliga regler och redovisa urval, insatsmodell, saknade kopplingar, avbrott och walkover. Matcha entydigt via event och båda spelar-id:n. Skapa aldrig bokförda spel, bortval eller sändningsmarkeringar i bets. Anropa inte portföljens skriv- eller notifieringsverktyg.

Använd de då sparade förhandspriserna och TA-värdena; räkna inte om historisk TA med senare ratingar. odds innehåller senaste giltiga förhandspris per event, ingen full prishistorik eller separat observationstid. Exakt öppnings-/stängningspris eller historiskt klockslagsurval kan därför inte garanteras. TA-priser inkluderar befintligt 5 procent sannolikhetspåslag. Ett oddsprisgap är inte EV; EV kräver marginalfri sannolikhet. Någon ny backtestmotor ingår inte i sammanslagningen.
