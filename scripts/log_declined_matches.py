"""Log documented declined matches without registering paper stakes."""

import argparse
import fcntl
import hashlib
import os
import json
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]


def utc(value):
    if value is None:
        return None
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('Timestamp must include a timezone.')
    return parsed.astimezone(timezone.utc).replace(tzinfo=None)


def dumps(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)


def prepare(check, candidates, offering, ratings, events):
    """Retain the recorded assessment; never invent missing probabilities."""
    ratings = {str(row['provider_id']): row for row in ratings}
    markets = {str(row['event']['id']): row['event'] for row in offering['response']['events']}
    event_map = {row['name'].casefold(): row for result in events for row in result['rows']}
    if 'vienna' in event_map:
        event_map['wien'] = event_map['vienna']
    records = []
    seen = set()
    for candidate in candidates:
        if candidate['decision'] != 'declined':
            continue
        match_id = str(candidate['offering_id'])
        if not 0 < len(match_id) <= 20:
            raise ValueError('Match ID must fit VARCHAR(20).')
        if match_id in seen:
            raise ValueError('Duplicate declined match in this check.')
        seen.add(match_id)
        reason = candidate.get('reason', '').strip()
        if not reason:
            raise ValueError('Every declined match needs a reason.')
        rating = ratings[match_id]
        if candidate['player_ids'] != [rating['a'], rating['b']]:
            raise ValueError('Player order differs from the saved TA assessment.')
        if rating['a'] == rating['b']:
            raise ValueError('A match must contain two different players.')
        market = markets[match_id]
        edition = event_map.get(market['group'].casefold(), {})
        first_name = candidate['match'].split('–', 1)[0]
        record = dict(
            id=match_id, assessed_at=check['checked_at'], portfolio_id=check['portfolio_id'],
            player=rating['a'], player_name=rating['a_name'],
            opponent=rating['b'], opponent_name=rating['b_name'],
            event=candidate.get('event_id', edition.get('id')),
            tournament=market['group'], surface=candidate.get('surface', edition.get('surface')),
            scheduled_at=candidate.get('scheduled_start'), odds=candidate['odds'].get(first_name),
            odds_at=offering['checked_at'], match_status=candidate.get('state'),
            ta_probability=candidate.get('ta_probability_a'),
            gpt_probability=candidate.get('gpt_probability'),
            gpt_minimum_odds=candidate.get('gpt_minimum_odds'),
            rationale=reason, risk=candidate.get('risk', ''), status='declined', stake='0.00',
            source=offering['source'], candidate=candidate,
        )
        record['record_id'] = hashlib.sha256(dumps(record).encode()).hexdigest()
        records.append(record)
    return records


def append_log(path, records):
    """Append once per saved decision; the project permits one ping at a time."""
    added = 0
    with path.open('a+', encoding='utf-8') as output:
        fcntl.flock(output, fcntl.LOCK_EX)
        output.seek(0)
        known = {json.loads(line)['record_id'] for line in output if line.strip()}
        output.seek(0, 2)
        for record in records:
            if record['record_id'] not in known:
                output.write(dumps(record) + '\n')
                known.add(record['record_id'])
                added += 1
        output.flush()
    return added


def save_database(connection, records, source_path):
    """Write only declined rows. Existing paper bets are never overwritten."""
    changed = 0
    with connection.cursor() as cursor:
        for record in records:
            cursor.execute('SELECT status, history FROM bets WHERE id=%s FOR UPDATE', (record['id'],))
            existing = cursor.fetchone()
            if existing and existing['status'] != 'declined':
                continue
            # A supplier may replace its event ID; protect an already booked match too.
            if record['event']:
                cursor.execute("SELECT id FROM bets WHERE status<>'declined' AND event=%s AND ((player=%s AND opponent=%s) OR (player=%s AND opponent=%s))", (
                    record['event'], record['player'], record['opponent'], record['opponent'], record['player']))
                if cursor.fetchone():
                    continue
            history = json.loads(existing['history']) if existing else []
            if any(item.get('record_id') == record['record_id'] for item in history):
                continue
            history.append(dict(type='declined', record_id=record['record_id'],
                                checked_at=record['assessed_at'], data=record))
            probability = record['ta_probability']
            ta_odds = None
            if probability is not None:
                adjusted = min(Decimal('.999'), max(Decimal('.001'), Decimal(str(probability)) * Decimal('1.05')))
                ta_odds = (Decimal(1) / adjusted).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
            row = dict(
                id=record['id'], player=record['player'], player_name=record['player_name'],
                opponent=record['opponent'], opponent_name=record['opponent_name'],
                scheduled_at=utc(record['scheduled_at']), odds=record['odds'], stake=Decimal('0.00'),
                status='declined', score=None, rationale=record['rationale'], risk=record['risk'],
                event=record['event'], tournament=record['tournament'], surface=record['surface'],
                recommended_at=None, registered_at=datetime.now(timezone.utc).replace(tzinfo=None),
                odds_at=utc(record['odds_at']), ta_odds=ta_odds, ta_probability=probability,
                gpt_probability=record['gpt_probability'], gpt_minimum_odds=record['gpt_minimum_odds'],
                selection_method='Dokumenterat bortval; inget pappersspel bokfört.',
                sources=dumps(dict(assessment=str(source_path), odds_source=record['source'])),
                match_status=record['match_status'], winner=None, payout=None, net=None,
                checked_at=utc(record['assessed_at']), verification_source=record['source'],
                verification_match_id=record['id'], verification_note='Sparad historisk bedömning; ingen ny resultatkontroll.',
                history=dumps(history), retrospectives='[]', details=dumps(record),
            )
            if existing:
                # Keep the first row registration time, even when the assessment changes.
                del row['registered_at']
                columns = [key for key in row if key != 'id']
                cursor.execute('UPDATE bets SET ' + ','.join('`'+key+'`=%s' for key in columns) + ' WHERE id=%s',
                               tuple(row[key] for key in columns) + (record['id'],))
            else:
                columns = list(row)
                cursor.execute('INSERT INTO bets (' + ','.join('`'+key+'`' for key in columns) + ') VALUES (' + ','.join(['%s']*len(columns)) + ')',
                               tuple(row[key] for key in columns))
            changed += 1
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('check', type=Path)
    parser.add_argument('--skill-dir', type=Path, required=True)
    args = parser.parse_args()
    os.environ['ATP_TENNIS_SKILL_DIR'] = str(args.skill_dir.resolve())
    try:
        check_path = args.check.resolve()
        folder = ROOT / 'analysis' / check_path.stem
        paths = [check_path] + [folder / name for name in (
            'candidate-decisions.json', 'final-odds.json', 'ta.json', 'events.json')]
        try:
            from betting_data import DatabaseSource, request
        except ImportError:
            from scripts.betting_data import DatabaseSource, request
        source = DatabaseSource(ROOT)
        source.documents.update(request('read', prefix='analysis/'+check_path.stem+'/'))
        snapshots = {path: source.read_bytes(path) for path in paths}
        values = [json.loads(snapshots[path]) for path in paths]
        records = prepare(*values)
        log_key = 'tracking/declined_matches.jsonl'
        old_text = source.documents.get(log_key, '')
        known = {json.loads(line)['record_id'] for line in old_text.splitlines() if line.strip()}
        additions = [record for record in records if record['record_id'] not in known]
        appended = len(additions)
        log_text = old_text + ''.join(dumps(record)+'\n' for record in additions)
        result = request('write', documents={log_key: log_text},
                         declined_records=records, declined_source=str(paths[1]))
        changed = result['declined_rows_changed']
        print(dumps(dict(declined_matches=len(records), appended_to_log=appended, database_rows_changed=changed)))
        return 0
    except Exception as error:
        print('Bortvalsloggningen misslyckades: ' + type(error).__name__ + '. Inga databasdetaljer visas.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
