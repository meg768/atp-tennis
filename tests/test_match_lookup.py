import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.betting_data import connect


@unittest.skipUnless(os.environ.get('ATP_ODDS_INTEGRATION') == '1', 'MariaDB integration opt-in')
class MatchLookupTests(unittest.TestCase):
    def setUp(self):
        self.db = connect()
        # Session-local fixtures shadow the ATP tables only in this connection.
        # The real function is exercised; no rows in the ATP tables are changed.
        with self.db.cursor() as cursor:
            cursor.execute('CREATE TEMPORARY TABLE players(id VARCHAR(50),name VARCHAR(255)) '
                           'CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci')
            cursor.execute('CREATE TEMPORARY TABLE events(id VARCHAR(50),date DATE,name VARCHAR(255)) '
                           'CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci')
            cursor.execute('CREATE TEMPORARY TABLE matches(id VARCHAR(50),event VARCHAR(50),'
                           'winner VARCHAR(50),loser VARCHAR(50)) CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci')
            cursor.execute("INSERT INTO players VALUES('A','Alice Alpha'),('B','Bob Beta'),"
                           "('C','Tomáš Macháč'),('D','Daniel Delta')")
            cursor.execute("INSERT INTO events VALUES('E26','2026-10-26','Vienna'),"
                           "('E25','2025-10-27','Vienna')")
            cursor.execute("INSERT INTO matches VALUES('M1','E26','A','B'),"
                           "('M2','E26','C','D'),('OLD','E25','A','B')")

    def tearDown(self):
        self.db.close()

    def lookup(self, date='2026-10-29', tournament='Wien', a='Alice Alpha', b='Bob Beta'):
        with self.db.cursor() as cursor:
            cursor.execute('SELECT MATCH_LOOKUP(%s,%s,%s,%s) AS match_id', (date,tournament,a,b))
            return cursor.fetchone()['match_id']

    def test_names_ids_swapped_order_alias_and_edition(self):
        self.assertEqual(self.lookup(), 'M1')
        self.assertEqual(self.lookup(a='Bob Beta', b='Alice Alpha'), 'M1')
        self.assertEqual(self.lookup(tournament='E26', a='A', b='B'), 'M1')
        self.assertEqual(self.lookup(date='2025-10-29', tournament='Vienna'), 'OLD')
        self.assertEqual(self.lookup(a='  alice alpha  '), 'M1')
        self.assertEqual(self.lookup(a='Tomas Machac', b='Daniel Delta'), 'M2')

    def test_missing_or_unresolved_input_returns_null(self):
        for kwargs in ({'date':None}, {'tournament':''}, {'a':''}, {'a':'Alice'},
                       {'a':'Unknown'}, {'a':'A','b':'Alice Alpha'},
                       {'b':'Tomáš Macháč'}, {'date':'2024-10-29'}):
            with self.subTest(kwargs=kwargs):
                self.assertIsNone(self.lookup(**kwargs))

    def test_ambiguous_player_is_not_chosen_by_rank(self):
        with self.db.cursor() as cursor:
            cursor.execute("INSERT INTO players VALUES('OTHER','Alice Alpha')")
        self.assertIsNone(self.lookup())
        self.assertEqual(self.lookup(a='A',b='B'), 'M1')

    def test_ambiguous_tournament_edition_returns_null(self):
        with self.db.cursor() as cursor:
            cursor.execute("INSERT INTO events VALUES('OTHER','2026-10-19','Vienna')")
        self.assertIsNone(self.lookup())
        self.assertEqual(self.lookup(tournament='E26'), 'M1')

    def test_multiple_matches_including_reversed_pair_return_null(self):
        with self.db.cursor() as cursor:
            cursor.execute("INSERT INTO matches VALUES('REPEAT','E26','B','A')")
        self.assertIsNone(self.lookup())

    def test_edition_window_is_explicit_and_bounded(self):
        self.assertEqual(self.lookup(date='2026-10-19'), 'M1')
        self.assertIsNone(self.lookup(date='2026-10-18'))
        self.assertEqual(self.lookup(date='2026-11-15'), 'M1')
        self.assertIsNone(self.lookup(date='2026-11-16'))


if __name__ == '__main__':
    unittest.main()
