"""Complete missing opponent ranks through MariaDB's existing function."""
import json
import bisect
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys

sys.path.insert(0, str(Path.home() / '.agents/skills/atp-tennis/scripts'))
from database import execute

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'analysis/top10-comparison-direct'


def verify_batch(batch):
    """Verify ranking observations using one shared read query per batch."""
    if not batch:
        return []
    sql = ' UNION ALL '.join(
        ['SELECT %s AS request_index, PLAYER_RANK_AT_DATE(%s, %s) AS rank_value'] * len(batch)
    )
    params = tuple(value for index, (opponent, entries, _) in enumerate(batch)
                   for value in (index, opponent, entries[0][1]))
    rows = execute(sql, params)[0]['rows']
    actuals = {row['request_index']: row['rank_value'] for row in rows}
    if len(rows) != len(batch) or set(actuals) != set(range(len(batch))):
        raise ValueError('Incomplete ranking verification result')
    results = []
    for index, (_, entries, rank) in enumerate(batch):
        actual = actuals[index]
        if actual != rank:
            raise ValueError('Routine result differs from ranking observations')
        results.extend((key, actual) for key, _ in entries)
    return results


def main():
    matches = json.loads((FOLDER / 'missing-rank-matches.json').read_text())
    cache_file = FOLDER / 'rank-fallback-cache.json'
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    pairs = sorted({(r['opponent'], r['date']) for r in matches if r['opponent']})
    # Read the same observations used by PLAYER_RANK_AT_DATE. Only possible
    # top-10 additions need server calls; other ranks cannot enter the aggregate.
    history = defaultdict(list)
    opponents = sorted({opponent for opponent, _ in pairs})
    placeholders = ','.join(['%s'] * len(opponents))
    sql = f'''SELECT m.winner player,e.date,m.id,m.winner_rank player_rank
              FROM matches m JOIN events e ON e.id=m.event
              WHERE m.winner IN ({placeholders}) AND m.winner_rank>0
              UNION ALL SELECT m.loser,e.date,m.id,m.loser_rank
              FROM matches m JOIN events e ON e.id=m.event
              WHERE m.loser IN ({placeholders}) AND m.loser_rank>0'''
    for observation in execute(sql, tuple(opponents + opponents))[0]['rows']:
        if observation['date']:
            history[observation['player']].append((str(observation['date']), observation['id'], observation['player_rank']))
    for observations in history.values():
        observations.sort()
    groups = defaultdict(list)
    for opponent, date in pairs:
        observations = history[opponent]
        index = bisect.bisect_right(observations, (date, chr(0x10ffff), float('inf'))) - 1
        observation = observations[index] if index >= 0 else None
        rank = observation[2] if observation else None
        key = opponent + '|' + date
        groups[(opponent, observation)].append((key, date))
    tasks = []
    for (opponent, observation), entries in groups.items():
        rank = observation[2] if observation else None
        known = next((cache[key] for key, _ in entries if key in cache), 'not_cached')
        if known != 'not_cached':
            assert known == rank, 'Cached rank differs from observation history'
            for key, _ in entries:
                cache[key] = known
        elif rank is not None and rank <= 10:
            tasks.append((opponent, entries, rank))
        else:
            for key, _ in entries:
                cache[key] = rank
    batches = [tasks[i:i+10] for i in range(0, len(tasks), 10)]
    print(f'Verifying {len(tasks)} possible top-10 ranking states with the database function', flush=True)
    with ThreadPoolExecutor(max_workers=4) as executor:
        for i, results in enumerate(executor.map(verify_batch, batches), 1):
            cache.update(results)
            cache_file.write_text(json.dumps(cache, indent=2))
            print(f'Verified batches: {i}/{len(batches)}', flush=True)
    rows = json.loads((FOLDER / 'results.json').read_text())
    by_id = {r['id']: r for r in rows}
    for r in rows:
        r['wins'], r['losses'] = int(r['wins']), int(r['losses'])
        r['fallback_wins'] = r['fallback_losses'] = r['unresolved'] = 0
    for match in matches:
        rank = cache.get(str(match['opponent']) + '|' + match['date'])
        row = by_id[match['player']]
        if rank is None or rank <= 0:
            row['unresolved'] += 1
        elif rank <= 10:
            field = 'wins' if match['won'] else 'losses'
            row[field] += 1
            row['fallback_' + field] += 1
    (FOLDER / 'results-with-fallback.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False))
    print(json.dumps(rows, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    main()
