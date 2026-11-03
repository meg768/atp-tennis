"""Replay historical prices: select any side with stored TA odds < Oddset odds."""
import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from calculate_target_profit import FOLDER, TARGET, CENT, money, stake_for, totals


def calculate():
    source=json.loads((FOLDER/'source.json').read_text())[0]['rows']
    groups=defaultdict(list)
    for row in source:
        groups[row['id']].append(row)
    match_counts=Counter(r['match_id'] for r in source if r['match_id'])
    settled=[]; excluded=[]
    for identifier,candidates in groups.items():
        row=candidates[0]
        base=dict(odds_id=identifier,scheduled_at=row['time'],event=row['event_name'],
                  player=row['player_name'],opponent=row['opponent_name'],match_id=row['match_id'])
        reason=None
        if len(candidates)!=1 or (row['match_id'] and match_counts[row['match_id']]!=1):
            reason='ambiguous_or_duplicate_match'
        elif not row['match_id']:
            reason='no_matched_database_result'
        elif row['result_status']!='Completed':
            reason='excluded_status_'+str(row['result_status'])
        if reason:
            excluded.append(dict(base,reason=reason)); continue
        valid=[]; selected=[]
        for side in ('player','opponent'):
            ta=row[side+'_ta']; price=row[side+'_oddset']
            if ta is None or price is None: continue
            ta=Decimal(str(ta)); price=Decimal(str(price))
            if ta<=1 or price<=1: continue
            valid.append(side)
            if ta<price: selected.append((side,ta,price))
        if not selected:
            excluded.append(dict(base,reason='no_ta_below_oddset' if valid else 'missing_or_invalid_prices'))
        for side,ta,price in selected:
            stake=stake_for(price)
            won=row[side]==row['result_winner']
            paid=money(stake*price) if won else Decimal(0)
            settled.append(dict(base,selection=row[side+'_name'],ta_odds=str(ta),odds=str(price),
                                result='won' if won else 'lost',score=row['result_score'],
                                stake_sek=f'{stake:.2f}',payout_sek=f'{paid:.2f}',net_sek=f'{paid-stake:.2f}'))
            assert ta<price
            assert abs(paid-stake-TARGET)<=CENT if won else paid==0
    summary=dict(calculated_at_utc=datetime.now(timezone.utc).isoformat(),
                 selection='Test both players; bet only where stored TA odds are strictly lower than own Oddset price. Equal prices excluded.',
                 staking='100/(Oddset odds-1), aiming for 100 SEK net profit per winning bet; nearest ore half up',
                 source='Same 68-row historical snapshot as previous simulations',
                 completed=totals(settled),distinct_settled_matches=len({r['match_id'] for r in settled}),
                 excluded=dict(Counter(r['reason'] for r in excluded)),
                 per_event={e:totals([r for r in settled if r['event']==e]) for e in sorted({r['event'] for r in settled})},
                 limitations=['TA prices already include the existing 5% probability markup; this price filter does not establish positive model EV.',
                              'Stored historical TA and valid prematch Oddset prices; no new ratings or live prices.',
                              'Completed, unambiguous matches only. No portfolio writes or notifications.'])
    for name,rows in [('ta-price-filter-settled',settled),('ta-price-filter-excluded',excluded)]:
        with (FOLDER/(name+'.csv')).open('w',newline='') as output:
            writer=csv.DictWriter(output,lineterminator='\n',fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    (FOLDER/'ta-price-filter-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    assert summary['distinct_settled_matches']+len(excluded)==len(groups)
    assert sum((Decimal(r['net_sek']) for r in settled),Decimal(0))==Decimal(summary['completed']['net_sek'])
    print(json.dumps(summary,indent=2,ensure_ascii=False))

if __name__=='__main__':
    calculate()
