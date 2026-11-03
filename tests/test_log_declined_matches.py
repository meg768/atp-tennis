"""Protect financial separation and repeated logging of declined matches."""

from pathlib import Path
import json
import tempfile
import unittest

from scripts.log_declined_matches import append_log, prepare, save_database


class DeclinedMatchesTests(unittest.TestCase):
    def records(self):
        return prepare(
            {'checked_at': '2026-10-31T08:57:00+01:00', 'portfolio_id': 'paper'},
            [dict(offering_id=123, decision='declined', reason='Price too low',
                  player_ids=['A', 'B'], match='Alice–Bob', odds={'Alice': '2.50', 'Bob': '1.50'},
                  state='NOT_STARTED', scheduled_start='2026-10-31T14:00:00Z')],
            {'checked_at': '2026-10-31T08:56:00+01:00', 'source': 'saved-source',
             'response': {'events': [{'event': {'id': 123, 'group': 'Unknown'}}]}},
            [dict(provider_id=123, a='A', b='B', a_name='Alice', b_name='Bob')],
            [{'rows': []}],
        )

    def test_missing_assessments_are_not_invented(self):
        row = self.records()[0]
        self.assertEqual(row['status'], 'declined')
        self.assertEqual(row['stake'], '0.00')
        for key in ('event', 'surface', 'gpt_probability', 'gpt_minimum_odds'):
            self.assertIsNone(row[key])

    def test_repeated_decision_appends_once_and_changed_reason_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'decisions.jsonl'
            rows = self.records()
            self.assertEqual(append_log(path, rows), 1)
            self.assertEqual(append_log(path, rows), 0)
            changed = dict(rows[0], record_id='new-decision', rationale='Data uncertain')
            self.assertEqual(append_log(path, [changed]), 1)
            self.assertEqual(len(path.read_text().splitlines()), 2)

    def test_booked_database_row_is_never_overwritten(self):
        class Cursor:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def execute(self, sql, params):
                if not sql.startswith('SELECT'):
                    raise AssertionError('Attempted to change a booked bet')
            def fetchone(self): return {'status': 'won', 'history': '[]'}
        class Connection:
            def cursor(self): return Cursor()
        self.assertEqual(save_database(Connection(), self.records(), Path('source.json')), 0)

    def test_database_insert_has_zero_stake_and_no_booked_outcome(self):
        calls = []
        class Cursor:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def execute(self, sql, params): calls.append((sql, params))
            def fetchone(self): return None
        class Connection:
            def cursor(self): return Cursor()
        self.assertEqual(save_database(Connection(), self.records(), Path('source.json')), 1)
        sql, values = calls[-1]
        columns = sql.split('(', 1)[1].split(')', 1)[0].replace('`', '').split(',')
        row = dict(zip(columns, values))
        self.assertEqual(row['status'], 'declined')
        self.assertEqual(row['stake'], 0)
        for key in ('net', 'payout', 'recommended_at'):
            self.assertIsNone(row[key])
        self.assertEqual(json.loads(row['history'])[0]['type'], 'declined')


if __name__ == '__main__':
    unittest.main()
