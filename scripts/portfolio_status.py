"""Read the canonical paper ledger and latest ping directly from ATP bets."""

import argparse
from datetime import datetime
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import sys
from zoneinfo import ZoneInfo


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ZONE = ZoneInfo('Europe/Stockholm')
SETTLED = {'won', 'lost', 'void'}


def timestamp(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('En tidsstämpel saknar tidszon.')
    return result


def read_status(root=PROJECT_ROOT, source=None):
    if source is None:
        try:
            from betting_data import DatabaseSource
        except ImportError:
            from scripts.betting_data import DatabaseSource
        source = DatabaseSource(root)
    root = Path(root)
    ledger_path = root / 'tracking/bets.json'
    events_path = root / 'tracking/settlements.jsonl'
    ledger_bytes = source.read_bytes(ledger_path)
    events_bytes = source.read_bytes(events_path)
    ledger = json.loads(ledger_bytes)
    bets = {bet['bet_id']: bet for bet in ledger['bets']}
    if len(bets) != len(ledger['bets']):
        raise ValueError('Dubbla spel-ID i spelloggen.')

    latest = {}
    for line in events_bytes.splitlines():
        if line.strip():
            event = json.loads(line)
            if event['bet_id'] not in bets:
                raise ValueError('Avräkningen avser ett spel som saknas i serien.')
            latest[event['bet_id']] = event

    checks = []
    for path in source.glob('tracking/checks/*.json'):
        content = source.read_bytes(path)
        check = json.loads(content)
        if check.get('portfolio_id') == ledger['portfolio_id']:
            checks.append((timestamp(check['checked_at']), path.name, path, content, check))
    if not checks:
        raise ValueError('Ingen sparad pingkontroll finns för aktuell serie.')
    _, _, check_path, check_bytes, check = max(checks, key=lambda item: item[:2])
    cutoff = timestamp(check['checked_at'])
    observations = {row['bet_id']: row for row in check['bets']}
    if len(observations) != len(check['bets']) or set(observations) != set(bets):
        raise ValueError('Senaste pingkontrollen och spelloggen innehåller olika spel.')

    net = paid = settled_stake = open_stake = Decimal(0)
    wins = losses = voids = 0
    active = []
    for bet_id, bet in bets.items():
        row = observations[bet_id]
        event = latest.get(bet_id, {})
        status = event.get('status', 'pending')
        if status not in SETTLED | {'pending', 'review'}:
            raise ValueError('Okänd status i avräkningsloggen.')
        if event and timestamp(event['checked_at']) > cutoff:
            raise ValueError('Avräkningsloggen är nyare än senaste pingkontrollen.')
        if status in SETTLED or row.get('status') in SETTLED:
            for key in ('status', 'score', 'winner_id', 'payout_sek', 'net_sek'):
                if row.get(key) != event.get(key):
                    raise ValueError('Senaste pingkontrollen och avräkningen skiljer sig.')
        elif row.get('status') not in ('pending', 'review'):
            raise ValueError('Okänd status i pingkontrollen.')

        stake = Decimal(str(bet['stake_sek']))
        if status in SETTLED:
            net += Decimal(str(event['net_sek']))
            paid += Decimal(str(event['payout_sek']))
            if status != 'void':
                settled_stake += stake
            wins += status == 'won'
            losses += status == 'lost'
            voids += status == 'void'
        else:
            open_stake += stake
            start = row.get('current_scheduled_start', bet.get('scheduled_start'))
            if start:
                start = timestamp(start).astimezone(ZONE).isoformat()
            active.append(dict(bet_id=bet_id, player_name=bet['player_name'],
                               opponent_name=bet['opponent_name'], odds=str(bet['odds']),
                               ta_odds=str(bet['ta_odds']), stake_sek=f'{stake:.2f}',
                               status=row['status'], match_status=row.get('match_status'),
                               score=row.get('score'), current_scheduled_start=start))

    totals = dict(realized_net_sek=f'{net:.2f}', open_stake_sek=f'{open_stake:.2f}',
                  wins=wins, losses=losses, voids=voids,
                  settled_match_count=wins + losses, total_bet_count=len(bets),
                  roi_percent=f'{net / settled_stake * 100:.2f}' if settled_stake else None)
    if any(check.get(key) != value for key, value in totals.items()):
        raise ValueError('Totalsummorna i senaste ping stämmer inte med bokföringen.')

    sources = [(ledger_path, ledger_bytes), (events_path, events_bytes),
               (check_path, check_bytes)]
    digest = hashlib.sha256()
    for path, content in sources:
        if source.read_bytes(path) != content:
            raise ValueError('Projektfiler ändrades medan bokföringen lästes.')
        digest.update(str(path.relative_to(root)).encode() + b'\0' + content + b'\0')
    active.sort(key=lambda row: (row['current_scheduled_start'] is None,
                                timestamp(row['current_scheduled_start']) if row['current_scheduled_start']
                                else datetime.max.replace(tzinfo=ZONE), row['bet_id']))
    return dict(portfolio_id=ledger['portfolio_id'], checked_at=check['checked_at'],
                check_file=str(check_path.relative_to(root)), state_id=digest.hexdigest()[:16],
                **totals, active_bets=active)


def render(status):
    stamp = timestamp(status['checked_at']).astimezone(ZONE)
    lines = [f'Senaste sparade ping: {stamp:%Y-%m-%d %H.%M} svensk tid.',
             f"Serie: {status['portfolio_id']}", f"Kontrollkod: {status['state_id']}",
             f"Pappersnetto: {status['realized_net_sek']} kr | Öppen insats: {status['open_stake_sek']} kr",
             f"Avgjorda: {status['settled_match_count']} av {status['total_bet_count']} | "
             f"Vinster: {status['wins']} | Förluster: {status['losses']} | Void: {status['voids']}",
             f"ROI: {status['roi_percent'] + ' %' if status['roi_percent'] is not None else '—'}", '',
             'Öppna spel enligt senaste sparade kontroll:']
    for index, row in enumerate(status['active_bets'], 1):
        start = timestamp(row['current_scheduled_start']).strftime('%d/%m %H.%M') if row['current_scheduled_start'] else 'Starttid okänd'
        label = 'Oklar avräkning' if row['status'] == 'review' else {
            'NOT_STARTED': 'Spel bokfört – inväntar matchstart',
            'STARTED': 'Pågående', 'P': 'Pågående', 'LIVE': 'Pågående',
            'POSTPONED': 'Uppskjuten', 'DELAYED': 'Försenad',
            'SUSPENDED': 'Tillfälligt avbruten', 'INTERRUPTED': 'Tillfälligt avbruten',
            'F': 'Slutresultat inväntar kontroll',
        }.get(row['match_status'], 'Oklar status')
        diff = 100 * (1 / Decimal(row['ta_odds']) - 1 / Decimal(row['odds']))
        lines.append(f"{index}. {row['player_name']}–{row['opponent_name']} | {start} (prel.) | "
                     f"Låst odds {row['odds']} | TA {row['ta_odds']} | Diff {diff:+.1f} pp | "
                     f"{row['stake_sek']} kr | {label}" + (f" | {row['score']}" if row['score'] else ''))
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--json', action='store_true', help='Maskinläsbar status för jämförelse mellan Macarna')
    args = parser.parse_args()
    try:
        status = read_status()
        print(json.dumps(status, ensure_ascii=False, indent=2) if args.json else render(status))
    except (OSError, ValueError, KeyError, TypeError, InvalidOperation) as error:
        print(f'Kan inte läsa en sammanhängande bokföring: {error}\n'
              'Kontrollera databasanslutningen. Ingen lokal reserv eller ny spellogg används.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
