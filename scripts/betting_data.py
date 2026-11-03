"""Canonical betting documents in MariaDB; existing reporting formats are preserved."""
import argparse
import base64
from datetime import datetime, timezone
import fnmatch
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
try:
    from storage_policy import retain, compact, overview, RECIPIENTS
except ImportError:
    from scripts.storage_policy import retain, compact, overview, RECIPIENTS

ROOT = Path(__file__).resolve().parents[1]
PYTHON = Path.home()/'.local/share/codex/atp-tennis/venv/bin/python'


def request(action, **values):
    process = subprocess.run([str(PYTHON), str(Path(__file__).resolve()), action],
                             input=json.dumps(values, ensure_ascii=False), capture_output=True,
                             text=True, timeout=120)
    if process.returncode:
        raise ValueError('ATP-databasen kunde inte läsas eller uppdateras. Ingen lokal reserv används.')
    return json.loads(process.stdout)


class DatabaseSource:
    def __init__(self, root=ROOT, prefix='tracking/'):
        self.root = Path(root)
        self.documents = request('read', prefix=prefix)

    def read_bytes(self, path):
        key = str(Path(path).relative_to(self.root))
        if key not in self.documents:
            raise FileNotFoundError('Uppgift saknas i bets: '+key)
        return self.documents[key].encode('utf-8')

    def glob(self, pattern):
        return [self.root/key for key in self.documents if fnmatch.fnmatch(key, pattern)
                and '/' not in key[len(pattern.split('*')[0]):]]

    def claim_document(self, key, text):
        return request('claim', documents={key: text})

    def write_document(self, key, text):
        return request('write', documents={key: text})


class DirectorySource:
    """Explicit migration/test input only; never used as production fallback."""
    def __init__(self, root): self.root = Path(root)
    def read_bytes(self, path): return Path(path).read_bytes()
    def glob(self, pattern): return list(self.root.glob(pattern))


def connect():
    skill = Path(os.environ.get('ATP_TENNIS_SKILL_DIR', str(Path.home()/'.agents/skills/atp-tennis')))
    spec = importlib.util.spec_from_file_location('atp_database', skill/'scripts/database.py')
    database = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(database)
    settings, port = database._settings()
    import pymysql
    return pymysql.connect(host=settings['DB_HOST'], port=port, database=settings['DB_NAME'],
        user=settings['DB_USER'], password=settings['DB_PASSWORD'], charset='utf8mb4',
        autocommit=False, connect_timeout=10, read_timeout=60, write_timeout=60,
        cursorclass=pymysql.cursors.DictCursor)


def unpack(rows):
    documents, owners = {}, {}
    for row in rows:
        for key, value in json.loads(row['documents'] or '{}').items():
            if key in documents:
                raise ValueError('Duplicate database document: '+key)
            documents[key], owners[key] = value, row['id']
    return documents, owners


def document_path(name):
    return '$."'+hashlib.sha256(name.encode('utf-8')).hexdigest()+'"'


def document_record(name, content, is_text, updated_at):
    """Preserve bytes and source metadata; binary archives use lossless base64."""
    return dict(name=name, content=content.decode('utf-8') if is_text else base64.b64encode(content).decode('ascii'),
                is_text=int(is_text), sha256=hashlib.sha256(content).hexdigest(), updated_at=updated_at)


def record_bytes(record):
    content = record['content'].encode('utf-8') if record['is_text'] else base64.b64decode(record['content'], validate=True)
    if hashlib.sha256(content).hexdigest() != record['sha256']:
        raise ValueError('Document checksum mismatch: '+record['name'])
    return content


def read_documents(cursor, prefix='', names=()):
    condition = 'LEFT(d.name,%s)=%s'
    params = [len(prefix), prefix]
    if names:
        condition += ' OR d.name IN ('+','.join(['%s']*len(names))+')'
        params.extend(names)
    cursor.execute("""SELECT d.record FROM bets AS b,
        JSON_TABLE(COALESCE(b.data,'{}'), '$.*' COLUMNS(
        name VARCHAR(512) PATH '$.name', record JSON PATH '$')) AS d WHERE """+condition, params)
    result = {}
    for row in cursor.fetchall():
        record = json.loads(row['record'])
        if record['name'] in result: raise ValueError('Duplicate document: '+record['name'])
        result[record['name']] = record_bytes(record).decode('utf-8')
    return result


def store_document(cursor, name, text, if_absent=False):
    path = document_path(name)
    cursor.execute("SELECT id FROM bets WHERE JSON_CONTAINS_PATH(COALESCE(data,'{}'),'one',%s)", (path,))
    owners = cursor.fetchall()
    if len(owners) > 1: raise ValueError('Duplicate document: '+name)
    if owners and if_absent: return
    if owners:
        owner = owners[0]['id']
    else:
        cursor.execute('SELECT id FROM bets ORDER BY COALESCE(OCTET_LENGTH(data),0),id LIMIT 1')
        owner = cursor.fetchone()['id']
    record = document_record(name,text.encode('utf-8'),1,datetime.now(timezone.utc).replace(tzinfo=None).isoformat(timespec='microseconds'))
    cursor.execute("UPDATE bets SET data=JSON_SET(COALESCE(data,'{}'),%s,JSON_EXTRACT(%s,'$')) WHERE id=%s",(path,json.dumps(record,ensure_ascii=False),owner))


def validate_changes(existing, changes):
    for key, text in changes.items():
        if not isinstance(text, str) or key.startswith('/') or '..' in Path(key).parts:
            raise ValueError('Use project-relative document keys and UTF-8 text.')
        if key.startswith('tracking/notifications/') and json.loads(text) != {'attempted': True}:
            raise ValueError('Only a duplicate-send marker is retained; no email receipts.')
        # Dated analyses and original observations are immutable after first import.
        if key.startswith(('analysis/', 'tracking/checks/', 'tracking/archive/', 'revisions/')) and key in existing and existing[key] != text:
            raise ValueError('Historical analysis/check cannot be overwritten: '+key)
        if key == 'tracking/bets.json' and key in existing:
            old = json.loads(existing[key])
            new = json.loads(text)
            if old['portfolio_id'] != new['portfolio_id']:
                raise ValueError('Portfolio cannot be replaced by a normal ping.')
            indexed = {bet['bet_id']:bet for bet in new['bets']}
            if len(indexed) != len(new['bets']) or any(indexed.get(bet['bet_id']) != bet for bet in old['bets']):
                raise ValueError('Existing locked recommendations cannot be changed or deleted.')
            matches = [(bet['event_id'],tuple(sorted([bet['player_id'],bet['opponent_id']]))) for bet in new['bets']]
            if len(matches) != len(set(matches)):
                raise ValueError('Duplicate match in paper ledger.')
        if key in ('tracking/settlements.jsonl', 'tracking/declined_matches.jsonl') and key in existing and not text.startswith(existing[key]):
            raise ValueError('Settlement history is append-only.')


def sync_rows(cursor, documents):
    """Keep the existing readable bets columns consistent with the canonical documents."""
    from datetime import datetime, timezone
    from decimal import Decimal as D
    def dt(value):
        return datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(timezone.utc).replace(tzinfo=None) if value else None
    def dump(value): return json.dumps(value, ensure_ascii=False, default=str)
    if 'tracking/bets.json' not in documents: return
    ledger = json.loads(documents['tracking/bets.json'])
    checks = [json.loads(value) for key,value in documents.items()
              if key.startswith('tracking/checks/') and key.endswith('.json')]
    checks = [check for check in checks if check.get('portfolio_id') == ledger['portfolio_id']]
    if not checks: return
    check = max(checks, key=lambda c: dt(c['checked_at']))
    observations = {o['bet_id']:o for o in check['bets']}
    if set(observations) != {b['bet_id'] for b in ledger['bets']}:
        raise ValueError('Ledger and latest database check contain different bets.')
    retrospective = json.loads(documents.get('tracking/retrospectives.json','{}')).get('comments',{})
    for bet in ledger['bets']:
        observation = observations[bet['bet_id']]
        identifier = str(bet['oddset_match_id'])
        cursor.execute('SELECT id,player,opponent,odds,stake,status,history,retrospectives,match_status,score,winner,scheduled_at,payout,net,checked_at,verification_source,verification_match_id,verification_note FROM bets WHERE id=%s FOR UPDATE',(identifier,))
        old = cursor.fetchone()
        if old and old['status'] != 'declined':
            if old['player'] != bet['player_id'] or old['opponent'] != bet['opponent_id'] or old['odds'] != D(str(bet['odds'])) or old['stake'] != D(str(bet['stake_sek'])):
                raise ValueError('Locked paper bet cannot be changed.')
        if not old and bet.get('event_id'):
            cursor.execute("SELECT id FROM bets WHERE event=%s AND ((player=%s AND opponent=%s) OR (player=%s AND opponent=%s)) AND status<>'declined'",(bet['event_id'],bet['player_id'],bet['opponent_id'],bet['opponent_id'],bet['player_id']))
            if cursor.fetchone(): raise ValueError('Duplicate booked match under another provider ID.')
        settled = observation['status'] in ('won','lost','void')
        updates = dict(status=observation['status'],match_status=observation.get('match_status'),
            score=observation.get('score'),winner=observation.get('winner_id'),
            scheduled_at=dt(observation.get('current_scheduled_start',bet.get('scheduled_start'))),
            payout=D(observation['payout_sek']) if settled else None,
            net=D(observation['net_sek']) if settled else None,
            checked_at=dt(observation.get('result_verified_at') or observation.get('status_verified_at') or observation.get('checked_at') or check['checked_at']),
            verification_source=observation.get('source'),
            verification_match_id=str(observation['source_match_id']) if observation.get('source_match_id') is not None else None,
            verification_note=observation.get('note'),retrospectives=dump(retrospective.get(bet['bet_id'],[])))
        if settled:
            paid = (D(str(bet['stake_sek']))*D(str(bet['odds']))).quantize(D('.01')) if observation['status']=='won' else D(str(bet['stake_sek'])) if observation['status']=='void' else D(0)
            if paid != updates['payout'] or paid-D(str(bet['stake_sek'])) != updates['net']:
                raise ValueError('Settlement amounts do not match locked stake/odds.')
        if old and old['status'] != 'declined':
            updates = {key:value for key,value in updates.items() if (json.loads(old[key]) != json.loads(value) if key=='retrospectives' else old[key] != value)}
            if not updates: continue
            history = json.loads(old['history'])
        else:
            updates.update(player=bet['player_id'],opponent=bet['opponent_id'],player_name=bet['player_name'],opponent_name=bet['opponent_name'],event=bet.get('event_id'),tournament=bet['tournament'],surface=bet.get('surface'),
                recommended_at=dt(bet['recommended_at']),registered_at=dt(bet['registered_at']),odds_at=dt(bet['odds_checked_at']),odds=D(str(bet['odds'])),stake=D(str(bet['stake_sek'])),ta_odds=bet.get('ta_odds'),ta_probability=bet.get('ta_probability'),gpt_probability=bet.get('probability_subjective'),gpt_minimum_odds=bet.get('minimum_odds_subjective'),rationale=bet['rationale'],risk=bet['risk'],selection_method=bet['selection_method'],sources=dump({key:bet.get(key) for key in ['recommendation_source','odds_source','additional_sources']}),details=dump(bet))
            history = json.loads(old['history']) if old else []
        history.append(dict(type='database_update',checked_at=check['checked_at'],data=observation))
        updates['history'] = dump(history)
        keys = list(updates)
        if old:
            cursor.execute('UPDATE bets SET '+','.join('`'+key+'`=%s' for key in keys)+' WHERE id=%s',tuple(updates[key] for key in keys)+(identifier,))
        else:
            cursor.execute('INSERT INTO bets (`id`,'+','.join('`'+key+'`' for key in keys)+') VALUES ('+','.join(['%s']*(len(keys)+1))+')',(identifier,)+tuple(updates[key] for key in keys))


def backend(action, payload):
    connection = connect()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SET SESSION time_zone='+00:00'")
            if action in ('write','migrate','claim'):
                cursor.execute("SELECT GET_LOCK('atp_betting_documents',10) AS acquired")
                if cursor.fetchone()['acquired'] != 1: raise ValueError('Another ping is writing.')
            if action == 'read':
                prefix=payload.get('prefix','')
                if prefix=='tracking/overview.md':
                    return {'tracking/overview.md':overview(read_documents(cursor,'tracking/'))}
                result=read_documents(cursor,prefix)
                if 'tracking/email_recipients.json'.startswith(prefix):
                    result['tracking/email_recipients.json']=json.dumps(RECIPIENTS)
                return result
            incoming=payload['documents']
            if any(not retain(k) and k!='tracking/overview.md' for k in incoming):
                raise ValueError('Only fundamental betting data may be stored. Keep presentation and raw working data temporary.')
            payload['documents']={k:compact(k,v) for k,v in incoming.items() if k!='tracking/overview.md'}
            existing = read_documents(cursor, 'tracking/', list(payload['documents']))
            changes = payload['documents']
            if action == 'claim':
                if len(changes) != 1:
                    raise ValueError('Claim exactly one notification receipt.')
                key = next(iter(changes))
                if not key.startswith('tracking/notifications/'):
                    raise ValueError('Claims are restricted to notification receipts.')
                if key in existing:
                    return dict(claimed=False, value=existing[key])
            validate_changes(existing, changes)
            for key,text in changes.items():
                if existing.get(key) == text: continue
                if key in existing:
                    previous = existing[key].encode('utf-8')
                    digest = hashlib.sha256(previous).digest()
                    revision = 'revisions/'+key+'/'+digest.hex()
                    store_document(cursor, revision, existing[key], if_absent=True)
                store_document(cursor, key, text)
            merged = {**existing,**changes}
            sync_rows(cursor, merged)
            declined_changed = 0
            if 'declined_records' in payload:
                try:
                    from log_declined_matches import save_database
                except ImportError:
                    from scripts.log_declined_matches import save_database
                declined_changed = save_database(connection, payload['declined_records'], payload['declined_source'])
            connection.commit()
            if action == 'claim':
                return dict(claimed=True)
            cursor.execute('SELECT SUM(COALESCE(JSON_LENGTH(data),0)) AS n FROM bets')
            return dict(changed_documents=sum(existing.get(key)!=text for key,text in changes.items()),total_documents=int(cursor.fetchone()['n'] or 0),declined_rows_changed=declined_changed)
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def main():
    if Path(sys.executable).absolute() != PYTHON.absolute():
        os.execv(str(PYTHON), [str(PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['read','write','migrate','get','put','claim'])
    parser.add_argument('key',nargs='?')
    args = parser.parse_args()
    try:
        if args.action == 'get':
            data = backend('read',dict(prefix=args.key));sys.stdout.write(data[args.key]);return
        if args.action == 'put':
            payload = dict(documents={args.key:sys.stdin.read()});action='write'
        else:
            payload = json.load(sys.stdin);action=args.action
        print(json.dumps(backend(action,payload),ensure_ascii=False))
    except Exception as error:
        print('Databasoperation misslyckades: '+type(error).__name__+' (inga anslutningsuppgifter visas).',file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
