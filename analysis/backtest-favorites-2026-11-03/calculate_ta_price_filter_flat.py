"""Same TA < Oddset selections, now with a fixed 100 SEK stake per match."""
import csv
import json
from datetime import datetime, timezone
from decimal import Decimal
from calculate_target_profit import FOLDER, money, totals


def calculate():
    with (FOLDER/'ta-price-filter-settled.csv').open(newline='') as source:
        rows=list(csv.DictReader(source))
    previous=json.loads((FOLDER/'ta-price-filter-summary.json').read_text())
    for row in rows:
        assert Decimal(row['ta_odds'])<Decimal(row['odds'])
        stake=Decimal(100)
        payout=money(stake*Decimal(row['odds'])) if row['result']=='won' else Decimal(0)
        row.update(stake_sek='100.00',payout_sek=f'{payout:.2f}',net_sek=f'{payout-stake:.2f}')
    summary=dict(calculated_at_utc=datetime.now(timezone.utc).isoformat(),
                 selection=previous['selection'],staking='Fixed 100 SEK per match',
                 source='Identical 33 selections and saved prices as ta-price-filter-settled.csv',
                 completed=totals(rows),excluded=previous['excluded'],
                 per_event={e:totals([r for r in rows if r['event']==e]) for e in sorted({r['event'] for r in rows})},
                 limitations=previous['limitations'])
    assert summary['completed']['matches']==33 and summary['completed']['wins']==15
    assert len({r['match_id'] for r in rows})==len(rows)
    expected=sum((Decimal(100)*(Decimal(r['odds'])-1) if r['result']=='won' else Decimal(-100)
                  for r in rows),Decimal(0))
    assert expected==Decimal(summary['completed']['net_sek'])
    with (FOLDER/'ta-price-filter-flat-settled.csv').open('w',newline='') as output:
        writer=csv.DictWriter(output,lineterminator='\n',fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    (FOLDER/'ta-price-filter-flat-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(summary,indent=2,ensure_ascii=False))

if __name__=='__main__':
    calculate()
