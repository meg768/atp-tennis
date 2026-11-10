"""Send the daily ATP report through Apple Mail on Mac mini."""

import argparse
import fcntl
import json
import os
from datetime import datetime
from pathlib import Path
import subprocess
import sys
from zoneinfo import ZoneInfo

CONFIG = Path.home() / '.config/atp-tennis'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--preview', action='store_true', help='verify Apple Mail and the recipient list')
    mode.add_argument('--send', action='store_true', help='send the report received as JSON on stdin')
    args = parser.parse_args()
    recipients = json.loads((CONFIG / 'analysis_email_recipients.json').read_text())
    if not recipients or not all(isinstance(r, str) and '@' in r and r.isprintable() for r in recipients):
        raise ValueError('Ogiltig mottagarlista.')
    if args.preview:
        subprocess.run(['/usr/bin/osascript', '-e', 'tell application id "com.apple.mail" to get version'],
                       check=True, timeout=15)
        print(f'Apple Mail svarar. {len(recipients)} mottagare i analyslistan.')
        return

    payload = sys.stdin.buffer.read(48_001)
    if len(payload) > 48_000:
        raise ValueError('Analysmejlet är för stort.')
    message = json.loads(payload)
    day = datetime.now(ZoneInfo('Europe/Stockholm')).date().isoformat()
    body = message['body']
    if message['date'] != day or not body.startswith('Dagens analys') or '\0' in body:
        raise ValueError('Fel datum eller format i analysmejlet.')

    # Keep a date only. Once a send is attempted, uncertain delivery is not retried.
    marker = CONFIG / 'daily_analysis_last_attempt'
    with marker.open('a+') as state:
        fcntl.flock(state, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state.seek(0)
        if state.read().strip() == day:
            raise ValueError('Dagens analysmejl har redan försökts.')
        state.seek(0)
        state.truncate()
        state.write(day + '\n')
        state.flush()
        os.fsync(state.fileno())
        sender = Path.home() / 'GitHub/atp-tennis/scripts/send_ping_mail.applescript'
        subprocess.run(['/usr/bin/osascript', str(sender), '\n'.join(recipients),
                        f'Dagens analys · ATP {day}', body], check=True, timeout=45)
    print('Apple Mail accepterade analysmejlet.')


if __name__ == '__main__':
    os.umask(0o077)
    main()
