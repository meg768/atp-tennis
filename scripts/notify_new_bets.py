"""Report the date-ordered paper betting list by email through Apple Mail."""

import argparse
from datetime import datetime
from decimal import Decimal
import json
import re
from pathlib import Path
import subprocess
import sys
from zoneinfo import ZoneInfo


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SENDER = Path(__file__).with_name('send_ping_mail.applescript')
ZONE = ZoneInfo('Europe/Stockholm')


def load_recipients(path, source=None):
    entries = json.loads(source.read_bytes(path) if source else path.read_text())
    if not isinstance(entries, list) or not entries:
        raise ValueError('Email recipient list must be a nonempty list.')
    recipients = []
    seen = set()
    for address in entries:
        if not isinstance(address, str) or not re.fullmatch(r'[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+', address):
            raise ValueError('Invalid email recipient.')
        if address.casefold() not in seen:
            recipients.append(address)
            seen.add(address.casefold())
    return recipients


def readable_paragraphs(text):
    """Keep saved wording intact while splitting long prose at sentence boundaries."""
    paragraphs = []
    for block in re.split(r'\n\s*\n', text.strip()):
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])', block)
        paragraph = ''
        for sentence in sentences:
            if paragraph and len(paragraph) + len(sentence) + 1 > 320:
                paragraphs.append(paragraph)
                paragraph = ''
            paragraph = (paragraph + ' ' + sentence).strip()
        if paragraph:
            paragraphs.append(paragraph)
    return '\n\n'.join(paragraphs)


def match_start(observation, bet):
    value = observation.get('current_scheduled_start', bet.get('scheduled_start'))
    if not value:
        return None
    start = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if start.tzinfo is None:
        raise ValueError('Match start must include a timezone.')
    return start


def active_list(check, bets):
    rows = [row for row in check['bets'] if row.get('status') not in ('won', 'lost', 'void')]
    if len(rows) > 10:
        raise ValueError('More than ten active bets.')
    def sort_key(row):
        start = match_start(row, bets[row['bet_id']])
        return (start is None, start or datetime.max.replace(tzinfo=ZONE), row['bet_id'])
    return sorted(rows, key=sort_key)


def reasons_for(check, ledger):
    bets = {bet['bet_id']: bet for bet in ledger['bets']}
    sections = []
    slots = active_list(check, bets)
    for index, row in enumerate(slots, 1):
        bet_id = row['bet_id']
        bet = bets[bet_id]
        reason = bet.get('rationale')
        if not isinstance(reason, str) or not reason.strip():
            raise ValueError(f'Active bet {bet_id} is missing its rationale.')
        new = ' [NYTT]' if bet_id in check['new_bets'] else ''
        odds = f"{Decimal(str(bet['odds'])):.2f}".replace('.', ',')
        stake = f"{Decimal(str(bet['stake_sek'])):.2f}".replace('.', ',')
        lines = [
            f"Spel {index}{new}: {bet['player_name']} mot {bet['opponent_name']}",
            f'Låst odds: {odds} | Insats: {stake} kr',
            '', 'Varför detta spel?', '', readable_paragraphs(reason),
        ]
        risk = bet.get('risk')
        if isinstance(risk, str) and risk.strip():
            risk_items = re.split(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])', risk.strip())
            lines.extend(['', 'Risker', ''] + ['• ' + item for item in risk_items])
        sections.append('\n'.join(lines))
    return '\n\n\n'.join(sections)


def message_for(check, ledger):
    if check['portfolio_id'] != ledger['portfolio_id']:
        raise ValueError('Ping and current portfolio do not match.')
    ids = check['new_bets']
    if not isinstance(ids, list) or len(ids) != len(set(ids)) or len(ids) > 10:
        raise ValueError('Invalid new_bets list.')
    bets = {bet['bet_id']: bet for bet in ledger['bets']}
    observations = check['bets']
    observed_ids = [row['bet_id'] for row in observations]
    if len(observed_ids) != len(set(observed_ids)) or not set(ids) <= set(observed_ids):
        raise ValueError('Invalid ping observations.')
    if not set(observed_ids) <= set(bets):
        raise ValueError('Ping contains unknown bets.')
    slots = active_list(check, bets)
    stamp = datetime.fromisoformat(check['checked_at'])
    if stamp.tzinfo is None:
        raise ValueError('Ping timestamp must include a timezone.')
    lines = [f'Speltips {stamp.astimezone(ZONE):%d/%m kl. %H.%M}', 'Pappersportfölj']
    if not ids:
        lines.append('Inga nya spel.')
    if not slots:
        lines.append('Inga öppna spel.')
    for index, observation in enumerate(slots):
        bet = bets[observation['bet_id']]
        new = ' [NYTT]' if bet['bet_id'] in ids else ''
        start = match_start(observation, bet)
        start_text = start.astimezone(ZONE).strftime('%d/%m %H.%M') + ' (prel.)' if start else 'Starttid okänd'
        state = observation.get('match_status')
        if observation.get('status') == 'review':
            status = 'Oklar avräkning'
        else:
            status = {
                'NOT_STARTED': 'Spel bokfört – inväntar matchstart',
                'STARTED': 'Pågående', 'P': 'Pågående', 'LIVE': 'Pågående',
                'POSTPONED': 'Uppskjuten', 'DELAYED': 'Försenad',
                'SUSPENDED': 'Tillfälligt avbruten', 'INTERRUPTED': 'Tillfälligt avbruten',
                'F': 'Slutresultat inväntar kontroll',
            }.get(state, 'Oklar status')
        score = observation.get('score')
        if isinstance(score, str) and score.strip():
            status += ' | ' + score
        odds = f"{Decimal(str(bet['odds'])):.2f}".replace('.', ',')
        ta_odds = f"{Decimal(str(bet['ta_odds'])):.2f}".replace('.', ',')
        diff = 100 * (1 / Decimal(str(bet['ta_odds'])) - 1 / Decimal(str(bet['odds'])))
        diff_text = f'{diff:+.1f}'.replace('.', ',')
        stake = f"{Decimal(str(bet['stake_sek'])):.2f}".replace('.', ',')
        lines.extend([
            f"Spel {index + 1}{new}: {bet['player_name']} mot {bet['opponent_name']}",
            status,
            f"{bet['tournament']}, {start_text} | {stake} kr",
            f'Svenska Spel (låst) {odds} | TA {ta_odds} | Diff {diff_text} pp',
        ])
    if 'realized_net_sek' in check and 'open_stake_sek' in check:
        net = f"{Decimal(str(check['realized_net_sek'])):.2f}".replace('.', ',')
        opened = f"{Decimal(str(check['open_stake_sek'])):.2f}".replace('.', ',')
        lines.append(f'Pappersnetto {net} kr | Öppen insats {opened} kr')
    reasons = reasons_for(check, ledger)
    if reasons:
        lines.extend(['', reasons])
    return '\n'.join(lines)


def history_for(check, ledger, events, retrospectives):
    latest = {}
    cutoff = datetime.fromisoformat(check['checked_at'])
    for event in events:
        if datetime.fromisoformat(event['checked_at']) <= cutoff:
            latest[event['bet_id']] = event
    comments = retrospectives.get('comments', {}) if retrospectives.get('portfolio_id') == ledger['portfolio_id'] else {}
    lines = ['Resultathistorik sedan start',
             'Aktuell pappersserie. Kommentarerna är efterhandstolkningar, inte verifierade orsaker till utfallet.']
    net = Decimal(0)
    paid = Decimal(0)
    risked = Decimal(0)
    wins = losses = voids = 0
    for bet in sorted(ledger['bets'], key=lambda b: (b.get('registered_at', b.get('recommended_at', '')), b['bet_id'])):
        event = latest.get(bet['bet_id'], {})
        status = event.get('status')
        if status not in ('won', 'lost', 'void'):
            continue
        wins += status == 'won'
        losses += status == 'lost'
        voids += status == 'void'
        net += Decimal(str(event['net_sek']))
        paid += Decimal(str(event['payout_sek']))
        if status != 'void':
            risked += Decimal(str(bet['stake_sek']))
        label = {'won': 'Vinst', 'lost': 'Förlust', 'void': 'Återbetalt'}[status]
        money = lambda value: f'{Decimal(str(value)):.2f}'.replace('.', ',')
        lines.extend(['', f"Avgjort: {bet['player_name']} mot {bet['opponent_name']}",
                      f"{bet['tournament']} | {label} | Resultat: {event.get('score') or '—'} (vald spelares perspektiv)",
                      f"Låst odds: {money(bet['odds'])} | Insats: {money(bet['stake_sek'])} kr",
                      f"Utbetalning: {money(event['payout_sek'])} kr | Netto: {money(event['net_sek'])} kr", '', 'Efterhandskommentar'])
        note = comments.get(bet['bet_id'], {})
        if note.get('status') == status and note.get('score') == event.get('score') and note.get('comment'):
            lines.append(readable_paragraphs(note['comment']))
        else:
            lines.append('Efteranalys saknas för detta verifierade utfall. Slutresultatet ensamt visar inte varför matchen fick det utfallet.')
    if not wins + losses + voids:
        lines.extend(['', 'Inga avgjorda spel ännu.'])
    else:
        roi = f'{net / risked * 100:.2f}'.replace('.', ',') + ' %' if risked else '—'
        lines.extend(['', f"Summering: {wins} vinster, {losses} förluster, {voids} återbetalda.",
                      f"Utbetalningar: {paid:.2f} kr | Realiserat netto: {net:.2f} kr | ROI: {roi}"])
    return '\n'.join(lines)


def prepare_email_attachment(source):
    """Encode a small delivery copy; keep the generated original intact."""
    destination = source.with_name(source.stem + '-email.jpg')
    for quality in (75, 55):
        result = subprocess.run(
            ['/usr/bin/sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', str(quality),
             '-Z', '1200', str(source), '--out', str(destination)],
            capture_output=True, text=True, timeout=20,
        )
        if result.returncode != 0 or not destination.is_file():
            raise ValueError('Unable to prepare the email image.')
        if destination.stat().st_size <= 500_000:
            return destination
    raise ValueError('Email image exceeds 500 kB after compression.')


def notify(check_path, preview=False, attachment=None, source=None):
    if source is None:
        try:
            from betting_data import DatabaseSource
        except ImportError:
            from scripts.betting_data import DatabaseSource
        source = DatabaseSource(PROJECT_ROOT)
    check_path = Path(check_path).resolve()
    tracking = PROJECT_ROOT.resolve() / 'tracking'
    if check_path.parent != (tracking / 'checks').resolve() or check_path.suffix != '.json':
        raise ValueError('Choose a current tracking/checks JSON file.')
    check = json.loads(source.read_bytes(check_path))
    ledger = json.loads(source.read_bytes(tracking / 'bets.json'))
    recipients = load_recipients(tracking / 'email_recipients.json', source)
    message = message_for(check, ledger)
    if attachment is not None:
        attachment = Path(attachment).resolve()
        if not attachment.is_file():
            raise ValueError('The poster attachment does not exist.')
        attachment = prepare_email_attachment(attachment)
        reasons = reasons_for(check, ledger)
        message = 'Mina bedömningar' + ('\n\n' + reasons if reasons else '')
    if preview:
        print('Recipients: ' + ', '.join(recipients))
        print(message)
        if attachment is not None:
            print(f'Attachment: {attachment}')
        return 0
    if not SENDER.is_file():
        raise ValueError('The Apple Mail sender script is missing.')

    folder = tracking / 'notifications'
    receipt = folder / check_path.name
    database_receipt = hasattr(source, 'claim_document')
    receipt_key = 'tracking/notifications/' + check_path.name
    # Retain only the duplicate-send guard; no email receipt or message copy.
    record = {'attempted': True}
    # Claim this ping before sending: an interrupted/uncertain send is not retried.
    if database_receipt:
        claim = source.claim_document(receipt_key, json.dumps(record, ensure_ascii=False))
        if not claim['claimed']:
            print('This ping already has a notification attempt; nothing resent.')
            return 0
    else:
        # Explicit directory fixtures only; production uses the database receipt.
        folder.mkdir(exist_ok=True)
        try:
            with receipt.open('x') as output:
                json.dump(record, output, ensure_ascii=False, indent=2)
                output.write('\n')
        except FileExistsError:
            print('This ping already has a notification attempt; nothing resent.')
            return 0

    details = ''
    try:
        command = ['osascript', str(SENDER), '\n'.join(recipients), 'ATP Speltips', message]
        if attachment is not None:
            command.append(str(attachment))
        result = subprocess.run(
            command,
            input=message, text=True, capture_output=True, timeout=25,
        )
        accepted = result.returncode == 0
        if not accepted:
            details = result.stderr.strip()
    except (OSError, subprocess.TimeoutExpired):
        accepted = False
    if accepted:
        print('Apple Mail accepted the ping email for sending.')
        return 0
    print('Email failed or its outcome is unknown. No automatic retry.', file=sys.stderr)
    if details:
        print(details, file=sys.stderr)
    return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('check', type=Path, help='Completed ping JSON in tracking/checks')
    parser.add_argument('--preview', action='store_true', help='Print text without sending or logging')
    parser.add_argument('--attachment', type=Path, help='Current poster; includes rationales for all active bets in the email')
    args = parser.parse_args()
    try:
        return notify(args.check, args.preview, args.attachment)
    except (OSError, ValueError, KeyError, TypeError):
        print('Unable to prepare notification; check the ping, ledger and Apple Mail.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
