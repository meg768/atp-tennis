# Compute Odds

Simple helper for comparing two players and calculating decimal odds from ELO.

## Files

- `run.js` - executable helper script that resolves players locally and calls `/api/players/odds`
- `compute-odds.js` - pure odds calculation from ELO values
- `sinner-alcaraz.js` - fixed endpoint test for Sinner vs Alcaraz

## Usage

```bash
node helpers/compute-odds/run.js "Jannik Sinner" Alcaraz
node helpers/compute-odds/run.js --hard S0AG A0E2
node helpers/compute-odds/run.js --clay "Jannik Sinner" Alcaraz
node helpers/compute-odds/run.js --grass S0AG A0E2
./helpers/compute-odds/sinner-alcaraz.js
./helpers/compute-odds/sinner-alcaraz.js --hard
```

## Behavior

- Matches both inputs against `players.id` and `players.name`
- Prefers exact ATP id match, then exact name, then prefix match, then broader name match
- Prints the chosen match for each input so it is easy to see what the script resolved
- Uses `elo_rank` by default
- Uses `elo_rank_hard`, `elo_rank_clay`, or `elo_rank_grass` when `--hard`, `--clay`, or `--grass` is provided
- Calls the local `/api/players/odds` endpoint after resolving the two players
- Prints the returned odds together with the resolved players and chosen surface
- Factor weights are normalized internally, so they do not need to sum to `1`
- You can think in weights such as `80, 10, 10` or `10, 20, 30`
- `sinner-alcaraz.js` also calls the local `/api/players/odds` endpoint directly

## Notes

- This is intentionally simple for now
- The next natural steps are better name matching and comparison against real bookmaker odds
