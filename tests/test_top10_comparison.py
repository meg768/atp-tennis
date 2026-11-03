"""Check ranking verification without querying MariaDB or rewriting analyses."""

import unittest
from unittest.mock import patch

from scripts import build_top10_comparison as comparison


class RankingVerificationTests(unittest.TestCase):
    def test_results_matched_to_requests_and_shared_states_expanded(self):
        batch = [
            ('S0AG', [('S0AG|2026-10-19', '2026-10-19'),
                      ('S0AG|2026-10-20', '2026-10-20')], 1),
            ('A0E2', [('A0E2|2026-10-19', '2026-10-19')], 3),
        ]
        rows = [{'request_index': 1, 'rank_value': 3},
                {'request_index': 0, 'rank_value': 1}]
        with patch.object(comparison, 'execute', return_value=[{'rows': rows}]) as execute:
            result = comparison.verify_batch(batch)
        self.assertEqual(result, [('S0AG|2026-10-19', 1), ('S0AG|2026-10-20', 1),
                                  ('A0E2|2026-10-19', 3)])
        execute.assert_called_once()
        self.assertEqual(execute.call_args.args[1],
                         (0, 'S0AG', '2026-10-19', 1, 'A0E2', '2026-10-19'))

    def test_disagreement_with_database_is_rejected(self):
        batch = [('S0AG', [('key', '2026-10-19')], 1)]
        with patch.object(comparison, 'execute', return_value=[{
            'rows': [{'request_index': 0, 'rank_value': 2}]
        }]):
            with self.assertRaisesRegex(ValueError, 'differs'):
                comparison.verify_batch(batch)

    def test_incomplete_or_duplicate_results_are_rejected(self):
        batch = [('S0AG', [('key', '2026-10-19')], 1)]
        for rows in ([], [{'request_index': 1, 'rank_value': 1}],
                     [{'request_index': 0, 'rank_value': 1}] * 2):
            with self.subTest(rows=rows), patch.object(comparison, 'execute',
                                                     return_value=[{'rows': rows}]):
                with self.assertRaisesRegex(ValueError, 'Incomplete'):
                    comparison.verify_batch(batch)

    def test_empty_batch_needs_no_database_access(self):
        with patch.object(comparison, 'execute') as execute:
            self.assertEqual(comparison.verify_batch([]), [])
            execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
