"""Export a read-only, consistent snapshot of approved ATP tables for GitHub."""
import gzip
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    from betting_data import connect
except ImportError:
    from scripts.betting_data import connect

ROOT = Path(__file__).resolve().parents[1]
TABLES = ('players', 'events', 'matches', 'odds', 'bets')


def export():
    import pymysql
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    folder = ROOT / 'data' / 'snapshots' / stamp
    folder.mkdir(parents=True, exist_ok=False)
    manifest = {'created_at_utc': stamp, 'source': 'ATP/MariaDB',
                'format': 'gzip JSON Lines; dates and decimals are strings',
                'purpose': 'Historical export only; never a live portfolio fallback', 'tables': {}}
    db = connect()
    try:
        with db.cursor() as cursor:
            cursor.execute("SET SESSION time_zone = '+00:00'")
            cursor.execute('SET TRANSACTION READ ONLY')
            cursor.execute('START TRANSACTION WITH CONSISTENT SNAPSHOT')
        for table in TABLES:
            path = folder / (table + '.jsonl.gz')
            count = 0
            with db.cursor(pymysql.cursors.SSDictCursor) as cursor, gzip.open(path, 'wt', encoding='utf-8') as output:
                cursor.execute('SELECT * FROM `' + table + '` ORDER BY id')
                for row in cursor:
                    output.write(json.dumps(row, ensure_ascii=False, default=str, separators=(',', ':')) + '\n')
                    count += 1
            manifest['tables'][table] = {'rows': count, 'file': path.name,
                                        'bytes': path.stat().st_size,
                                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            print(table, count, path.stat().st_size, flush=True)
        (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        return folder
    except Exception:
        for path in folder.iterdir():
            path.unlink()
        folder.rmdir()
        raise
    finally:
        db.rollback()
        db.close()


if __name__ == '__main__':
    print(export())
