"""Read the current paper series; simulate 100 SEK net per winning bet."""
import json
import sys
from datetime import datetime, timezone
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

FOLDER = Path(__file__).resolve().parent
sys.path.insert(0, str(FOLDER.parents[1]))
from scripts.betting_data import request
from scripts.portfolio_status import read_status


def money(value):
    return value.quantize(D('.01'), rounding=ROUND_HALF_UP)


def calculate():
    status = read_status()
    ledger = json.loads(request('read', prefix='tracking/bets.json')['tracking/bets.json'])
    check = json.loads(request('read', prefix=status['check_file'])[status['check_file']])
    observed = {r['bet_id']: r for r in check['bets']}
    rows = []
    for bet in ledger['bets']:
        result = observed[bet['bet_id']]
        odds = D(str(bet['odds']))
        assert odds > 1
        stake = money(D(100) / (odds - 1))
        outcome = result['status']
        if outcome == 'won':
            payout = money(stake * odds)
            assert abs(payout - stake - 100) <= D('.01')
        elif outcome == 'lost':
            payout = D(0)
        elif outcome == 'void':
            payout = stake
        else:
            payout = None
        rows.append(dict(
            bet_id=bet['bet_id'], event_id=bet['event_id'],
            player_id=bet['player_id'], opponent_id=bet['opponent_id'],
            player=bet['player_name'], opponent=bet['opponent_name'],
            odds=str(odds), result=outcome, score=result.get('score'),
            verification_source=result.get('source'),
            original_stake_sek=bet['stake_sek'],
            original_net_sek=result.get('net_sek'),
            simulated_stake_sek=f'{stake:.2f}',
            simulated_payout_sek=f'{payout:.2f}' if payout is not None else None,
            simulated_net_sek=f'{payout-stake:.2f}' if payout is not None else None))
    settled = [r for r in rows if r['result'] in ('won', 'lost')]
    total_stake = sum((D(r['simulated_stake_sek']) for r in settled), D(0))
    payout = sum((D(r['simulated_payout_sek']) for r in settled), D(0))
    net = payout - total_stake
    winning_net = sum((D(r['simulated_net_sek']) for r in settled if r['result'] == 'won'), D(0))
    losing_stakes = sum((D(r['simulated_stake_sek']) for r in settled if r['result'] == 'lost'), D(0))
    assert net == winning_net - losing_stakes
    assert sum((D(r['original_net_sek']) for r in settled), D(0)) == D(status['realized_net_sek'])
    assert len(settled) == status['settled_match_count']
    assert read_status()['state_id'] == status['state_id'], 'Ledger changed during calculation'
    summary = dict(
        calculated_at_utc=datetime.now(timezone.utc).isoformat(),
        portfolio_id=status['portfolio_id'], source_check=status['check_file'],
        source_checked_at=status['checked_at'], source_state_id=status['state_id'],
        rule='Insats = 100 / (låst decimalodds − 1). Mål: 100 kr nettovinst per vinst.',
        rounding='Insats och utbetalning avrundas separat till ören, ROUND_HALF_UP.',
        result_rules='Samma bokförda utfall som portföljen, inklusive redan bedömda avbrott. Inget nytt urval.',
        settled_matches=len(settled), wins=status['wins'], losses=status['losses'],
        voids=status['voids'], open_matches=len(rows)-len(settled)-status['voids'],
        simulated_stake_sek=f'{total_stake:.2f}', simulated_payout_sek=f'{payout:.2f}',
        simulated_net_sek=f'{net:.2f}', simulated_roi_percent=f'{net/total_stake*100:.2f}',
        winning_net_sek=f'{winning_net:.2f}', losing_stakes_sek=f'{losing_stakes:.2f}',
        minimum_stake_sek=f'{min(D(r["simulated_stake_sek"]) for r in rows):.2f}',
        maximum_stake_sek=f'{max(D(r["simulated_stake_sek"]) for r in rows):.2f}',
        flat_stake_total_sek=f'{sum(D(r["original_stake_sek"]) for r in settled):.2f}',
        flat_stake_net_sek=status['realized_net_sek'], flat_stake_roi_percent=status['roi_percent'],
        difference_net_sek=f'{net-D(status["realized_net_sek"]):.2f}')
    (FOLDER/'results.json').write_text(json.dumps(dict(summary=summary, matches=rows), ensure_ascii=False, indent=2)+'\n')
    lines = ['# Pappersportfölj: mål 100 kr netto per vinst', '',
             f'Källa: MariaDB bets, aktuell serie. Kontroll {status["checked_at"]}; kod {status["state_id"]}.', '',
             'Samma val, låsta odds och bokförda utfall som portföljen. Insats = 100/(odds−1). Insats och utbetalning avrundas till ören.',
             'Bokförda avbrottsbedömningar behålls. Ingen ny matchbedömning. Detta är separat analys utan databasskrivning eller utskick.', '',
             '| Mått | Fast 100 kr | Mål 100 kr nettovinst |', '|---|---:|---:|',
             f'| Total insats | {summary["flat_stake_total_sek"]} kr | {total_stake:.2f} kr |',
             f'| Netto | {status["realized_net_sek"]} kr | {net:.2f} kr |',
             f'| ROI | {status["roi_percent"]} % | {summary["simulated_roi_percent"]} % |', '',
             f'{len(settled)} avgjorda spel: {status["wins"]} vinster, {status["losses"]} förluster. {status["voids"]} void.',
             f'Vinsternas netto {winning_net:.2f} kr minus förlorade insatser {losing_stakes:.2f} kr = {net:.2f} kr.',
             f'Insatserna varierar mellan {summary["minimum_stake_sek"]} och {summary["maximum_stake_sek"]} kr.', '',
             'Lägre odds kräver större insats; högre odds kräver mindre insats. Resultatet gäller endast denna serie och bevisar inte framtida lönsamhet.', '',
             '| Vald spelare | Motståndare | Låst odds | Utfall | Simulerad insats | Simulerat netto |',
             '|---|---|---:|---|---:|---:|']
    for r in rows:
        lines.append(f'| {r["player"]} | {r["opponent"]} | {r["odds"]} | {r["result"]} | {r["simulated_stake_sek"]} | {r["simulated_net_sek"]} |')
    (FOLDER/'report.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    calculate()
