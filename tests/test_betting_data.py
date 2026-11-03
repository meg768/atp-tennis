"""Canonical data migration and preservation rules without live DB mutations."""
import json
import unittest
from scripts.betting_data import validate_changes, unpack, document_path, document_record, record_bytes, read_documents
from unittest.mock import Mock


class BettingDataTests(unittest.TestCase):
    def test_text_record_preserves_bytes_and_metadata(self):
        data='Åäö\nOriginal analys.\n'.encode()
        record=document_record('analysis/å/"text".md',data,1,'2026-10-31T20:00:00.123456')
        self.assertEqual(record_bytes(record),data)
        self.assertEqual(record['updated_at'],'2026-10-31T20:00:00.123456')
        self.assertEqual(record['name'],'analysis/å/"text".md')

    def test_binary_archive_is_lossless(self):
        data=bytes(range(256))*20
        self.assertEqual(record_bytes(document_record('archive/image.png',data,0,'stamp')),data)

    def test_changed_content_fails_checksum(self):
        record=document_record('test',b'original',1,'stamp')
        record['content']='changed'
        with self.assertRaises(ValueError):record_bytes(record)

    def test_document_paths_are_safe_and_distinct(self):
        path=document_path('å/"quoted".md')
        self.assertEqual(len(path),68)
        self.assertEqual(path,document_path('å/"quoted".md'))
        self.assertNotEqual(path,document_path('other'))

    def test_database_reader_rejects_duplicate_keys(self):
        cursor=Mock()
        record=document_record('test',b'content',1,'stamp')
        cursor.fetchall.return_value=[{'record':json.dumps(record)}]*2
        with self.assertRaises(ValueError):read_documents(cursor)

    def test_database_reader_preserves_escaped_json_and_line_breaks(self):
        text='{"analysis": "Åäö och \\"citat\\""}\nNästa rad.\n'
        record=document_record('tracking/checks/test.json',text.encode(),1,'stamp')
        cursor=Mock()
        cursor.fetchall.return_value=[{'record':json.dumps(record,ensure_ascii=False)}]
        self.assertEqual(read_documents(cursor,'tracking/'),{record['name']:text})

    def test_historical_analysis_cannot_change(self):
        old={'analysis/ping/assessment.md':'original', 'tracking/checks/ping.json':'{}'}
        validate_changes(old,old)
        for key in old:
            with self.assertRaises(ValueError): validate_changes(old,{key:'rewritten'})

    def test_ledger_cannot_change_old_probability_or_add_duplicate_match(self):
        bet=dict(bet_id='one',event_id='2026-352',player_id='A',opponent_id='B',probability_subjective=.4)
        old={'portfolio_id':'paper','bets':[bet]}
        key='tracking/bets.json'
        for incoming in [dict(old,bets=[dict(bet,probability_subjective=.9)]),
                         dict(old,bets=[bet,dict(bet,bet_id='two',player_id='B',opponent_id='A')]),
                         dict(old,bets=[])]:
            with self.assertRaises(ValueError):validate_changes({key:json.dumps(old)},{key:json.dumps(incoming)})

    def test_settlement_corrections_append_without_replacing_history(self):
        key='tracking/settlements.jsonl'
        validate_changes({key:'old\n'},{key:'old\ncorrection\n'})
        with self.assertRaises(ValueError):validate_changes({key:'old\n'},{key:'changed\n'})

    def test_declined_log_is_append_only(self):
        key='tracking/declined_matches.jsonl'
        validate_changes({key:'old\n'},{key:'old\nnew\n'})
        with self.assertRaises(ValueError):validate_changes({key:'old\n'},{key:''})

    def test_email_claim_only_retains_duplicate_guard(self):
        key='tracking/notifications/ping.json'
        validate_changes({}, {key:json.dumps({'attempted': True})})
        for value in [{'status':'accepted'}, {'attempted':True,'message':'email body'}]:
            with self.assertRaises(ValueError):validate_changes({}, {key:json.dumps(value)})

    def test_archives_and_saved_revisions_are_immutable(self):
        for key in ['tracking/archive/old/bets.json', 'revisions/report/hash']:
            with self.assertRaises(ValueError):validate_changes({key:'original'},{key:'changed'})

    def test_documents_round_trip_exact_text_and_duplicate_storage_is_detected(self):
        text='Åäö, 2,50\n\nOförändrad analys.\n'
        rows=[{'id':'one','documents':json.dumps({'tracking/overview.md':text})}]
        self.assertEqual(unpack(rows)[0]['tracking/overview.md'],text)
        with self.assertRaises(ValueError):unpack(rows+rows)


if __name__=='__main__':unittest.main()
