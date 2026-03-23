# Compute Odds

Simple helper for comparing two players and calculating decimal odds from ELO.

## Files

- `run.js` - executable helper script
- `compute-odds.js` - pure odds calculation from ELO values

## Usage

```bash
node helpers/compute-odds/run.js "Jannik Sinner" Alcaraz
node helpers/compute-odds/run.js --hard S0AG C0AZ
node helpers/compute-odds/run.js --clay "Jannik Sinner" Alcaraz
node helpers/compute-odds/run.js --grass S0AG C0AZ
```

## Behavior

- Matches both inputs against `players.id` and `players.name`
- Prefers exact ATP id match, then exact name, then prefix match, then broader name match
- Prints the chosen match for each input so it is easy to see what the script resolved
- Uses `elo_rank` by default
- Uses `elo_rank_hard`, `elo_rank_clay`, or `elo_rank_grass` when `--hard`, `--clay`, or `--grass` is provided
- Calculates win probability using the standard Elo logistic formula
- Prints both fair odds and a Svenska Spel comparison using a fixed 5% margin
- Factor weights are normalized internally, so they do not need to sum to `1`
- You can think in weights such as `80, 10, 10` or `10, 20, 30`

## Notes

- This is intentionally simple for now
- The next natural steps are better name matching and comparison against real bookmaker odds
