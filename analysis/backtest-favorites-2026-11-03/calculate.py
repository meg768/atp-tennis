"""Replay the captured read-only query; never access or write the paper ledger."""
import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

FOLDER = Path(__file__).resolve().parent
STAKE = Decimal('100')

def calculate():
    source = json.loads((FOLDER / 'source.json').read_text())[0]['rows']
    grouped = defaultdict(list)
    for row in source:
        grouped[row['id']].append(row)
    # Avoid treating two provider rows for the same completed match as two bets.
    match_counts = Counter(row['match_id'] for row in source if row['match_id'])
    settled, excluded = [], []
    for identifier, candidates in grouped.items():
        row = candidates[0]
        base = dict(odds_id=identifier, scheduled_at=row['time'], event=row['event_name'],
                    player=row['player_name'], opponent=row['opponent_name'],
                    match_id=row['match_id'])
        prices = [Decimal(str(row[k])) if row[k] is not None else None
                  for k in ('player_oddset', 'opponent_oddset')]
        reason = None
        if any(value is None or value <= 1 for value in prices):
            reason = 'missing_or_invalid_price'
        elif prices[0] == prices[1]:
            reason = 'equal_prices_no_favorite'
        elif len(candidates) != 1 or (row['match_id'] and match_counts[row['match_id']] != 1):
            reason = 'ambiguous_or_duplicate_match'
        elif not row['match_id']:
            reason = 'no_matched_database_result'
        elif row['result_status'] != 'Completed':
            reason = 'excluded_status_' + str(row['result_status'])
        if reason:
            excluded.append(dict(base, reason=reason))
            continue
        side = 'player' if prices[0] < prices[1] else 'opponent'
        price = min(prices)
        won = row[side] == row['result_winner']
        payout = STAKE * price if won else Decimal(0)
        settled.append(dict(base, favorite=row[side+'_name'], odds=str(price),
                            result='won' if won else 'lost', score=row['result_score'],
                            stake_sek=str(STAKE), payout_sek=f'{payout:.2f}',
                            net_sek=f'{payout-STAKE:.2f}'))
    def totals(rows):
        stake = STAKE * len(rows)
        paid = sum((Decimal(r['payout_sek']) for r in rows), Decimal(0))
        wins = sum(r['result'] == 'won' for r in rows)
        return dict(matches=len(rows), wins=wins, losses=len(rows)-wins,
                    stake_sek=f'{stake:.2f}', payout_sek=f'{paid:.2f}', net_sek=f'{paid-stake:.2f}',
                    roi_pct=f'{100*(paid-stake)/stake:.2f}' if stake else None,
                    hit_rate_pct=f'{100*Decimal(wins)/len(rows):.2f}' if rows else None)
    summary = dict(calculated_at_utc=datetime.now(timezone.utc).isoformat(),
                   scope='All currently stored ATP odds; lower Svenska Spel/Oddset price; flat 100 SEK',
                   odds_rows=len(grouped), completed=totals(settled),
                   excluded=dict(Counter(r['reason'] for r in excluded)),
                   per_event={event:totals([r for r in settled if r['event']==event])
                              for event in sorted({r['event'] for r in settled})},
                   dates=[min(r['scheduled_at'] for r in settled),max(r['scheduled_at'] for r in settled)],
                   limitations=['Last stored valid prematch prices; observation time unavailable.',
                                'Completed matches only. Aborted/walkover excluded, not treated as losses or refunds.',
                                'Missing imported result does not mean the match is unplayed.',
                                'Equal prices skipped because no unique favorite exists.',
                                'No writes to bets or notifications.'])
    for name, rows in [('settled',settled),('excluded',excluded)]:
        with (FOLDER/(name+'.csv')).open('w', newline='') as output:
            writer=csv.DictWriter(output,lineterminator='\n',fieldnames=list(rows[0]) if rows else [])
            writer.writeheader(); writer.writerows(rows)
    (FOLDER/'summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    assert len(settled)+len(excluded)==len(grouped)
    assert all(Decimal(r['payout_sek'])-STAKE==Decimal(r['net_sek']) for r in settled)
    print(json.dumps(summary,indent=2,ensure_ascii=False))

if __name__=='__main__':
    calculate()
