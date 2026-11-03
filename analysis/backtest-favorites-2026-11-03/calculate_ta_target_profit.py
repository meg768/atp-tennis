"""Choose the stored TA favorite and target 100 SEK net profit at Oddset prices."""
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
    matches=Counter(r['match_id'] for r in source if r['match_id'])
    with (FOLDER/'settled.csv').open(newline='') as input_file:
        old={r['odds_id']:r for r in csv.DictReader(input_file)}
    settled=[]; excluded=[]; changed=[]
    for identifier,candidates in groups.items():
        row=candidates[0]
        base=dict(odds_id=identifier,scheduled_at=row['time'],event=row['event_name'],
                  player=row['player_name'],opponent=row['opponent_name'],match_id=row['match_id'])
        ta=[Decimal(str(row[k])) if row[k] is not None else None
            for k in ('player_ta','opponent_ta')]
        reason=None
        if len(candidates)!=1 or (row['match_id'] and matches[row['match_id']]!=1):
            reason='ambiguous_or_duplicate_match'
        elif not row['match_id']:
            reason='no_matched_database_result'
        elif row['result_status']!='Completed':
            reason='excluded_status_'+str(row['result_status'])
        elif any(value is None or value<=1 for value in ta):
            reason='missing_or_invalid_stored_ta'
        elif ta[0]==ta[1]:
            reason='equal_ta_no_favorite'
        if reason:
            excluded.append(dict(base,reason=reason)); continue
        side='player' if ta[0]<ta[1] else 'opponent'
        price=Decimal(str(row[side+'_oddset'])) if row[side+'_oddset'] is not None else None
        if price is None or price<=1:
            excluded.append(dict(base,reason='missing_or_invalid_selected_oddset')); continue
        stake=stake_for(price)
        won=row[side]==row['result_winner']
        payout=money(stake*price) if won else Decimal(0)
        result=dict(base,favorite=row[side+'_name'],ta_odds=str(min(ta)),odds=str(price),
                    result='won' if won else 'lost',score=row['result_score'],
                    stake_sek=f'{stake:.2f}',payout_sek=f'{payout:.2f}',net_sek=f'{payout-stake:.2f}')
        settled.append(result)
        assert abs(payout-stake-TARGET)<=CENT if won else payout==0
        previous=old.get(str(identifier))
        if previous and previous['favorite']!=result['favorite']:
            changed.append(dict(odds_id=identifier,event=row['event_name'],
                                oddset_favorite=previous['favorite'],ta_favorite=result['favorite'],
                                oddset_result=previous['result'],ta_result=result['result']))
    summary=dict(calculated_at_utc=datetime.now(timezone.utc).isoformat(),
                 selection='Lower stored TA price; actual return and stake use selected player Oddset price',
                 staking='100/(Oddset odds-1); stake and payout rounded half up to ore',
                 source='Same 68-row captured database snapshot as previous simulations',
                 completed=totals(settled),excluded=dict(Counter(r['reason'] for r in excluded)),
                 per_event={e:totals([r for r in settled if r['event']==e]) for e in sorted({r['event'] for r in settled})},
                 changed_selections=changed,
                 added_vs_previous=[r['odds_id'] for r in settled if str(r['odds_id']) not in old],
                 omitted_vs_previous=[identifier for identifier in old if identifier not in {str(r['odds_id']) for r in settled}],
                 limitations=['Stored historical TA values only; no recalculation with newer ratings.',
                              'Completed, unambiguous matches only; no paper portfolio writes.',
                              'No value/EV filter: always choose the lower TA price when available.',
                              'Last valid stored prematch prices; exact observation time unavailable.'])
    for name,rows in [('ta-target-profit-settled',settled),('ta-target-profit-excluded',excluded)]:
        with (FOLDER/(name+'.csv')).open('w',newline='') as output:
            writer=csv.DictWriter(output,lineterminator='\n',fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    (FOLDER/'ta-target-profit-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    assert len(settled)+len(excluded)==len(groups)
    assert sum((Decimal(r['net_sek']) for r in settled),Decimal(0))==Decimal(summary['completed']['net_sek'])
    print(json.dumps(summary,indent=2,ensure_ascii=False))

if __name__=='__main__':
    calculate()
