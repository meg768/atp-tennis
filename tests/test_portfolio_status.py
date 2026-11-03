"""Check shared ledger accounting and incomplete-sync detection without writes."""

import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from scripts.portfolio_status import read_status as database_status, render
from scripts.betting_data import DirectorySource

def read_status(root):
    return database_status(root, source=DirectorySource(root))


class PortfolioStatusTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name) / 'Mac One' / 'ATP Betting'
        self.tracking = self.root / 'tracking'
        (self.tracking / 'checks').mkdir(parents=True)
        self.ledger = {'portfolio_id': 'shared-series', 'bets': [
            dict(bet_id=key, player_name=key, opponent_name='opponent',
                 stake_sek='75.00' if key == 'void' else '100.00',
                 odds='2.50', ta_odds='2.00', scheduled_start='2026-10-28T15:00:00Z',
                 user_reported_actual_bet={'stake_sek': '9999'})
            for key in ('won', 'lost', 'void', 'pending', 'review')
        ]}
        self.events = [
            dict(bet_id=key, checked_at='2026-10-28T00:00:00+01:00', status=key,
                 score='6-4 6-4', winner_id='winner',
                 payout_sek=payout, net_sek=net)
            for key, payout, net in (('won', '250.00', '150.00'),
                                     ('lost', '0.00', '-100.00'),
                                     ('void', '75.00', '0.00'))
        ]
        self.check = dict(portfolio_id='shared-series', checked_at='2026-10-28T00:30:00+01:00',
                          bets=[event.copy() for event in self.events] + [
                              dict(bet_id='pending', status='pending', match_status='NOT_STARTED',
                                   current_scheduled_start='2026-10-28T14:00:00+01:00'),
                              dict(bet_id='review', status='review', current_scheduled_start=None)],
                          realized_net_sek='50.00', open_stake_sek='200.00', wins=1, losses=1,
                          voids=1, settled_match_count=2, total_bet_count=5, roi_percent='25.00')
        self.save()

    def save(self):
        (self.tracking / 'bets.json').write_text(json.dumps(self.ledger))
        (self.tracking / 'settlements.jsonl').write_text(
            ''.join(json.dumps(event) + '\n' for event in self.events))
        (self.tracking / 'checks/current.json').write_text(json.dumps(self.check))

    def test_realized_results_open_stakes_and_void_exclusion(self):
        result = read_status(self.root)
        self.assertEqual(result['realized_net_sek'], '50.00')
        self.assertEqual(result['open_stake_sek'], '200.00')
        self.assertEqual(result['roi_percent'], '25.00')
        self.assertEqual(result['settled_match_count'], 2)
        self.assertEqual(result['voids'], 1)
        self.assertNotIn('9999', render(result))

    def test_identical_files_on_different_macs_give_identical_results(self):
        other = Path(self.directory.name) / 'Mac Two' / 'Shared Folder'
        shutil.copytree(self.root, other)
        self.assertEqual(read_status(self.root), read_status(other))

    def test_latest_check_uses_timezone_aware_time_not_filename(self):
        older = dict(self.check, checked_at='2026-10-28T01:00:00+02:00')
        (self.tracking / 'checks/zzz.json').write_text(json.dumps(older))
        self.assertEqual(read_status(self.root)['check_file'], 'tracking/checks/current.json')
        archived = dict(self.check, portfolio_id='archived-series', checked_at='2026-10-29T00:00:00Z')
        (self.tracking / 'checks/archive.json').write_text(json.dumps(archived))
        self.assertEqual(read_status(self.root)['portfolio_id'], 'shared-series')

    def test_settlement_correction_requires_updated_check(self):
        self.events.append(dict(self.events[0], status='lost', payout_sek='0.00',
                                net_sek='-100.00', checked_at='2026-10-28T00:10:00+01:00'))
        self.save()
        with self.assertRaisesRegex(ValueError, 'avräkningen skiljer'):
            read_status(self.root)

    def test_newer_settlement_is_not_combined_with_old_check(self):
        self.events[0]['checked_at'] = '2026-10-28T00:31:00+01:00'
        self.save()
        with self.assertRaisesRegex(ValueError, 'nyare'):
            read_status(self.root)

    def test_missing_bet_and_wrong_totals_are_rejected(self):
        self.check['bets'].pop()
        self.save()
        with self.assertRaisesRegex(ValueError, 'olika spel'):
            read_status(self.root)
        self.check['bets'].append(dict(bet_id='review', status='review'))
        self.check['realized_net_sek'] = '999.00'
        self.save()
        with self.assertRaisesRegex(ValueError, 'Totalsummorna'):
            read_status(self.root)

    def test_unknown_current_start_stays_unknown_and_sorts_last(self):
        active = read_status(self.root)['active_bets']
        self.assertEqual([row['bet_id'] for row in active], ['pending', 'review'])
        self.assertIsNone(active[-1]['current_scheduled_start'])

    def test_reading_never_changes_shared_files(self):
        def snapshot():
            return {str(p.relative_to(self.root)): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in self.root.rglob('*') if p.is_file()}
        before = snapshot()
        read_status(self.root)
        self.assertEqual(before, snapshot())


if __name__ == '__main__':
    unittest.main()
