"""Same captured favorites; vary stake to target 100 SEK net profit per win."""
import csv
import json
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

FOLDER = Path(__file__).resolve().parent
TARGET = Decimal('100')
CENT = Decimal('0.01')

def money(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)

def stake_for(odds):
    if odds <= 1:
        raise ValueError('Decimal odds must exceed 1')
    return money(TARGET / (odds - 1))

def totals(rows):
    stake = sum((Decimal(r['stake_sek']) for r in rows), Decimal(0))
    payout = sum((Decimal(r['payout_sek']) for r in rows), Decimal(0))
    wins = sum(r['result'] == 'won' for r in rows)
    return dict(matches=len(rows), wins=wins, losses=len(rows)-wins,
                stake_sek=f'{stake:.2f}', payout_sek=f'{payout:.2f}',
                net_sek=f'{payout-stake:.2f}', roi_pct=f'{100*(payout-stake)/stake:.2f}')

def calculate():
    with (FOLDER/'settled.csv').open(newline='') as source:
        rows = list(csv.DictReader(source))
    original = json.loads((FOLDER/'summary.json').read_text())
    assert len(rows) == original['completed']['matches'] == 34
    for row in rows:
        odds = Decimal(row['odds'])
        stake = stake_for(odds)
        payout = money(stake*odds) if row['result']=='won' else Decimal(0)
        row.update(stake_sek=f'{stake:.2f}', payout_sek=f'{payout:.2f}', net_sek=f'{payout-stake:.2f}')
        assert abs((payout-stake)-TARGET) <= CENT if row['result']=='won' else payout == 0
    summary = dict(calculated_at_utc=datetime.now(timezone.utc).isoformat(),
                   rule='Stake = 100/(decimal odds-1); target net profit 100 SEK per won bet',
                   rounding='Each stake and payout rounded to nearest ore, half up',
                   source='Same 34 matches and saved prices as the flat 100 SEK simulation',
                   completed=totals(rows),
                   per_event={event:totals([r for r in rows if r['event']==event])
                              for event in sorted({r['event'] for r in rows})},
                   min_stake_sek=min(rows,key=lambda r:Decimal(r['stake_sek']))['stake_sek'],
                   max_stake_sek=max(rows,key=lambda r:Decimal(r['stake_sek']))['stake_sek'],
                   excluded=original['excluded'],limitations=original['limitations'])
    with (FOLDER/'target-profit-settled.csv').open('w',newline='') as output:
        writer=csv.DictWriter(output,lineterminator='\n',fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    (FOLDER/'target-profit-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    # Independent identity: all winning profits minus all losing stakes.
    net=sum((Decimal(r['net_sek']) for r in rows if r['result']=='won'),Decimal(0))
    net-=sum((Decimal(r['stake_sek']) for r in rows if r['result']=='lost'),Decimal(0))
    assert net==Decimal(summary['completed']['net_sek'])
    assert stake_for(Decimal('1.50'))==200 and stake_for(Decimal('1.20'))==500
    print(json.dumps(summary,indent=2,ensure_ascii=False))

if __name__=='__main__':
    calculate()
