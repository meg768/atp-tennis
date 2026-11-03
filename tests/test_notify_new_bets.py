"""Exercise notification formatting and deduplication without sending emails."""

import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import subprocess

from scripts import notify_new_bets as notifications


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.check = {'portfolio_id': 'current', 'checked_at': '2026-10-22T22:27:00+02:00',
                      'new_bets': ['new'], 'bets': [
                          {'bet_id': 'old', 'status': 'lost', 'match_status': 'F'},
                          {'bet_id': 'new', 'status': 'pending', 'match_status': 'NOT_STARTED'},
                      ]}
        self.ledger = {'portfolio_id': 'current', 'bets': [
            {'bet_id': 'old', 'player_name': 'Old player'},
            {'bet_id': 'new', 'player_name': 'Luca Van Assche',
             'opponent_name': 'Lorenzo Musetti', 'tournament': 'Lyon',
             'scheduled_start': '2026-10-23T18:10:00Z', 'odds': '2.90', 'ta_odds': 2.37,
             'stake_sek': '100.00', 'rationale': 'Returspelet och underlaget ger spelvärde vid 2,90.'},
        ]}

    def test_open_slots_and_locked_values_are_reported(self):
        message = notifications.message_for(self.check, self.ledger)
        self.assertIn('Luca Van Assche mot Lorenzo Musetti', message)
        self.assertIn('Pappersportfölj', message)
        self.assertIn('23/10 20.10', message)
        self.assertIn('100,00 kr', message)
        self.assertIn('Svenska Spel (låst) 2,90 | TA 2,37 | Diff +7,7 pp', message)
        self.assertIn('Spel 1 [NYTT]', message)
        self.assertIn('Spel bokfört – inväntar matchstart', message)
        self.assertNotIn('Ledigt', message)
        self.assertNotIn('Spel 2:', message)
        self.assertNotIn('Old player', message)

    def test_no_new_bets_still_produces_ping_summary(self):
        self.check['new_bets'] = []
        message = notifications.message_for(self.check, self.ledger)
        self.assertIn('Inga nya spel', message)
        self.assertIn('Luca Van Assche mot Lorenzo Musetti', message)
        self.assertNotIn('[NYTT]', message)

    def test_live_unknown_and_review_status_are_not_inferred_from_time(self):
        row = self.check['bets'][1]
        for status, state, expected in (('pending', 'STARTED', 'Pågående'),
                                        ('pending', 'POSTPONED', 'Uppskjuten'),
                                        ('pending', None, 'Oklar status'),
                                        ('review', 'F', 'Oklar avräkning')):
            with self.subTest(state=state):
                row.update(status=status, match_status=state, score='6–4, 2–1')
                message = notifications.message_for(self.check, self.ledger)
                self.assertIn(expected + ' | 6–4, 2–1', message)

    def test_ten_active_bets_allowed_but_eleven_rejected(self):
        template = self.ledger['bets'][1]
        for index in range(9):
            bet_id = f'existing-{index}'
            self.ledger['bets'].append(dict(template, bet_id=bet_id))
            self.check['bets'].append({'bet_id': bet_id, 'status': 'pending'})
        message = notifications.message_for(self.check, self.ledger)
        self.assertIn('Spel 10 [NYTT]:', message)
        self.assertNotIn('Ledigt', message)
        self.ledger['bets'].append(dict(template, bet_id='eleventh'))
        self.check['bets'].append({'bet_id': 'eleventh', 'status': 'pending'})
        with self.assertRaises(ValueError):
            notifications.message_for(self.check, self.ledger)

    def test_five_new_bets_include_all_rationales(self):
        template = self.ledger['bets'][1]
        self.ledger['bets'] = [dict(template, bet_id=f'new-{i}',
                                    rationale=f'Motivering nummer {i}') for i in range(5)]
        self.check['new_bets'] = [bet['bet_id'] for bet in self.ledger['bets']]
        self.check['bets'] = [{'bet_id': bet_id, 'status': 'pending'}
                              for bet_id in self.check['new_bets']]
        message = notifications.message_for(self.check, self.ledger)
        self.assertIn('Spel 5 [NYTT]', message)
        for i in range(5):
            self.assertIn(f'Motivering nummer {i}', message)

    def test_existing_bet_missing_reason_blocks_sending(self):
        self.check['new_bets'] = []
        self.ledger['bets'][1].pop('rationale')
        with tempfile.TemporaryDirectory() as folder, patch.object(notifications.subprocess, 'run') as send:
            root = Path(folder)
            with self.assertRaises(ValueError):
                self.run_notification(root)
            send.assert_not_called()
            self.assertFalse((root/'tracking/notifications').exists())

    def test_mixed_active_bets_get_reasons_and_risks_in_slot_order(self):
        template = self.ledger['bets'][1]
        self.ledger['bets'].append(dict(template, bet_id='existing',
                                       rationale='Befintligt val har stöd i underlaget.',
                                       risk='Formen är osäker.'))
        self.check['bets'].insert(1, {'bet_id': 'existing', 'status': 'review'})
        message = notifications.reasons_for(self.check, self.ledger)
        self.assertLess(message.index('Befintligt val'), message.index(template['rationale']))
        self.assertIn('Spel 1:', message)
        self.assertIn('Spel 2 [NYTT]:', message)
        self.assertIn('Risker\n\n• Formen är osäker.', message)
        self.assertNotIn('Old player', message)

    def test_comment_layout_preserves_rationale_and_uses_risk_bullets(self):
        self.ledger['bets'][1]['risk'] = 'Formen är osäker. Skadebilden saknas.'
        text = notifications.reasons_for(self.check, self.ledger)
        self.assertIn('Varför detta spel?\n\n' + self.ledger['bets'][1]['rationale'], text)
        self.assertIn('Risker\n\n• Formen är osäker.\n• Skadebilden saknas.', text)
        self.assertNotIn('────────────────────', text)
        self.assertNotIn('**', text)

    def test_long_rationale_is_split_without_changing_words_or_decimal_odds(self):
        reason = ('Första meningen om underlaget ger stöd för valet. ' * 8
                  + 'Oddset 2.80 och 43 % är sparade vid bokföringen.')
        paragraphs = notifications.readable_paragraphs(reason)
        self.assertIn('\n\n', paragraphs)
        self.assertEqual(paragraphs.split(), reason.split())
        self.assertIn('2.80', paragraphs)

    def test_list_and_comments_sort_by_current_start_across_timezones(self):
        template = self.ledger['bets'][1]
        self.ledger['bets'].append(dict(template, bet_id='earlier', player_name='Earlier player'))
        self.check['bets'].append({'bet_id': 'earlier', 'status': 'pending',
                                   'current_scheduled_start': '2026-10-23T19:00:00+02:00'})
        self.check['bets'][1]['current_scheduled_start'] = '2026-10-24T12:00:00Z'
        for message in (notifications.message_for(self.check, self.ledger),
                        notifications.reasons_for(self.check, self.ledger)):
            self.assertLess(message.index('Earlier player'), message.index('Luca Van Assche'))
        self.assertEqual(self.ledger['bets'][1]['scheduled_start'], '2026-10-23T18:10:00Z')

    def test_unknown_start_sorts_last_and_is_not_replaced_by_old_start(self):
        template = self.ledger['bets'][1]
        self.ledger['bets'].append(dict(template, bet_id='known', player_name='Known start'))
        self.check['bets'].append({'bet_id': 'known', 'status': 'pending'})
        self.check['bets'][1]['current_scheduled_start'] = None
        message = notifications.message_for(self.check, self.ledger)
        self.assertLess(message.index('Known start'), message.index('Luca Van Assche'))
        self.assertIn('Starttid okänd', message)

    def test_empty_list_has_no_placeholder_slots(self):
        self.check['bets'] = [self.check['bets'][0]]
        self.check['new_bets'] = []
        message = notifications.message_for(self.check, self.ledger)
        self.assertIn('Inga öppna spel.', message)
        self.assertNotIn('Ledigt', message)

    def test_other_portfolio_or_duplicate_ids_rejected(self):
        for change in ({'portfolio_id': 'archive'}, {'new_bets': ['new', 'new']}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                notifications.message_for(dict(self.check, **change), self.ledger)

    def test_history_uses_latest_correction_and_excludes_future_events(self):
        bet = dict(self.ledger['bets'][1], bet_id='history')
        ledger = dict(self.ledger, bets=[bet])
        first = dict(bet_id='history', checked_at='2026-10-22T10:00:00+02:00',
                     status='won', score='6-4 6-4', payout_sek='290.00', net_sek='190.00')
        correction = dict(first, checked_at='2026-10-22T11:00:00+02:00',
                          status='lost', score='4-6 4-6', payout_sek='0.00', net_sek='-100.00')
        future = dict(first, checked_at='2026-10-23T11:00:00+02:00')
        notes = {'portfolio_id': 'current', 'comments': {'history':
                 {'status': 'won', 'score': first['score'], 'comment': 'STALE COMMENT'}}}
        text = notifications.history_for(self.check, ledger, [first, correction, future], notes)
        self.assertEqual(text.count('Avgjort:'), 1)
        self.assertIn('Förlust', text)
        self.assertIn('4-6 4-6', text)
        self.assertIn('0 vinster, 1 förluster', text)
        self.assertNotIn('STALE COMMENT', text)
        self.assertIn('Efteranalys saknas', text)

    def test_history_includes_comment_but_ignores_actual_bets(self):
        bet = dict(self.ledger['bets'][1], bet_id='history', user_reported_actual_bet={'stake_sek': '9999'})
        ledger = dict(self.ledger, bets=[bet])
        event = dict(bet_id='history', checked_at='2026-10-22T10:00:00+02:00',
                     status='won', score='6-4 6-4', payout_sek='290.00', net_sek='190.00', actual_net_sek='9999')
        notes = {'portfolio_id': 'current', 'comments': {'history':
                 {'status': 'won', 'score': event['score'], 'comment': 'En försiktig efterhandstolkning.'}}}
        text = notifications.history_for(self.check, ledger, [event], notes)
        self.assertIn('En försiktig efterhandstolkning.', text)
        self.assertIn('1 vinster, 0 förluster', text)
        self.assertNotIn('9999', text)
        self.assertIn('190,00 %', text)

    def test_recipient_list_deduplicates_and_rejects_invalid_input(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'recipients.json'
            path.write_text(json.dumps(['test@example.com', 'TEST@example.com', 'second@example.com']))
            self.assertEqual(notifications.load_recipients(path), ['test@example.com', 'second@example.com'])
            for entries in ([], 'test@example.com', ['bad'], ['test@example.com\nother@example.com']):
                with self.subTest(entries=entries):
                    path.write_text(json.dumps(entries))
                    with self.assertRaises(ValueError):
                        notifications.load_recipients(path)

    def run_notification(self, root, preview=False, attachment=None):
        tracking = root/'tracking'
        (tracking/'checks').mkdir(parents=True, exist_ok=True)
        (tracking/'bets.json').write_text(json.dumps(self.ledger))
        (tracking/'email_recipients.json').write_text(json.dumps(['magnus.egelberg@gmail.com', 'magnus@egelberg.se']))
        check_path = tracking/'checks'/'ping.json'
        check_path.write_text(json.dumps(self.check))
        with patch.object(notifications, 'PROJECT_ROOT', root), \
                patch.object(notifications, 'SENDER', Path(__file__)), \
                patch.object(notifications, 'prepare_email_attachment', side_effect=lambda path: path), \
                contextlib.redirect_stdout(io.StringIO()), \
                contextlib.redirect_stderr(io.StringIO()):
            from scripts.betting_data import DirectorySource
            return notifications.notify(check_path, preview, attachment, source=DirectorySource(root))

    def test_poster_includes_new_bet_reason_and_is_sent_only_once(self):
        with tempfile.TemporaryDirectory() as folder, \
                patch.object(notifications.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as send:
            root = Path(folder)
            poster = root/'poster.png'
            poster.write_bytes(b'poster fixture')
            expected = 'Mina bedömningar\n\n' + notifications.reasons_for(self.check, self.ledger)
            self.assertEqual(self.run_notification(root, attachment=poster), 0)
            self.assertEqual(self.run_notification(root, attachment=poster), 0)
            send.assert_called_once()
            self.assertEqual(send.call_args.kwargs['input'], expected)
            self.assertNotIn('Resultathistorik sedan start', send.call_args.kwargs['input'])
            self.assertEqual(send.call_args.args[0], ['osascript', str(Path(__file__)), 'magnus.egelberg@gmail.com\nmagnus@egelberg.se', 'ATP Speltips', expected, str(poster.resolve())])
            receipt = json.loads((root/'tracking/notifications/ping.json').read_text())
            self.assertEqual(receipt, {'attempted': True})

    def test_email_excludes_history_even_when_history_files_exist(self):
        with tempfile.TemporaryDirectory() as folder, \
                patch.object(notifications.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as send:
            root = Path(folder)
            tracking = root/'tracking'
            tracking.mkdir()
            # Malformed historical files must not affect the tips email.
            (tracking/'settlements.jsonl').write_text('not JSON')
            (tracking/'retrospectives.json').write_text('not JSON')
            self.assertEqual(self.run_notification(root), 0)
            text = send.call_args.kwargs['input']
            self.assertIn(self.ledger['bets'][1]['rationale'], text)
            self.assertNotIn('Resultathistorik', text)
            self.assertNotIn('Efterhandskommentar', text)

    def test_missing_reason_blocks_sending_before_receipt(self):
        for reason in (None, '', '   '):
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as folder, \
                    patch.object(notifications.subprocess, 'run') as send:
                self.ledger['bets'][1]['rationale'] = reason
                root = Path(folder)
                with self.assertRaises(ValueError):
                    self.run_notification(root)
                send.assert_not_called()
                self.assertFalse((root/'tracking/notifications').exists())

    def test_poster_without_new_bets_includes_existing_bet_reason(self):
        self.check['new_bets'] = []
        with tempfile.TemporaryDirectory() as folder, \
                patch.object(notifications.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as send:
            root = Path(folder)
            poster = root/'poster.png'
            poster.touch()
            self.assertEqual(self.run_notification(root, attachment=poster), 0)
            self.assertIn(self.ledger['bets'][1]['rationale'], send.call_args.kwargs['input'])
            self.assertIn('Varför detta spel?', send.call_args.kwargs['input'])
            self.assertNotIn('Old player', send.call_args.kwargs['input'])

    def test_missing_poster_does_not_send_or_claim_ping(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(notifications.subprocess, 'run') as send:
            root = Path(folder)
            with self.assertRaises(ValueError):
                self.run_notification(root, attachment=root/'missing.png')
            send.assert_not_called()
            self.assertFalse((root/'tracking/notifications').exists())

    def test_poster_preview_does_not_send_or_create_receipt(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(notifications.subprocess, 'run') as send:
            root = Path(folder)
            poster = root/'poster.png'
            poster.touch()
            self.assertEqual(self.run_notification(root, preview=True, attachment=poster), 0)
            send.assert_not_called()
            self.assertFalse((root/'tracking/notifications').exists())

    def test_success_sent_once_per_ping(self):
        with tempfile.TemporaryDirectory() as folder, \
                patch.object(notifications.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as send:
            root = Path(folder)
            self.assertEqual(self.run_notification(root), 0)
            self.assertEqual(self.run_notification(root), 0)
            send.assert_called_once()
            self.assertEqual(json.loads((root/'tracking/notifications/ping.json').read_text()), {'attempted': True})
            self.assertIn('Svenska Spel (låst) 2,90 | TA 2,37', send.call_args.kwargs['input'])

    def test_uncertain_send_is_not_retried(self):
        with tempfile.TemporaryDirectory() as folder, \
                patch.object(notifications.subprocess, 'run', side_effect=subprocess.TimeoutExpired('sender', 25)) as send:
            root = Path(folder)
            self.assertEqual(self.run_notification(root), 1)
            self.assertEqual(self.run_notification(root), 0)
            send.assert_called_once()
            self.assertEqual(json.loads((root/'tracking/notifications/ping.json').read_text()), {'attempted': True})

    def test_preview_never_sends_or_creates_receipt(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(notifications.subprocess, 'run') as send:
            root = Path(folder)
            self.assertEqual(self.run_notification(root, preview=True), 0)
            send.assert_not_called()
            self.assertFalse((root/'tracking/notifications').exists())


    def test_database_receipt_prevents_resend_without_any_local_data(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            receipt_key = 'tracking/notifications/ping.json'
            records = {receipt_key: json.dumps({'status': 'accepted'})}
            documents = {'tracking/checks/ping.json': json.dumps(self.check),
                         'tracking/bets.json': json.dumps(self.ledger),
                         'tracking/email_recipients.json': json.dumps(['test@example.com'])}
            class Source:
                def read_bytes(self, path): return documents[str(path.resolve().relative_to(root.resolve()))].encode()
                def claim_document(self, key, text):
                    if key in records: return {'claimed': False, 'value': records[key]}
                    records[key] = text
                    return {'claimed': True}
                def write_document(self, key, text): raise AssertionError('No email receipt may be written')
            with patch.object(notifications, 'PROJECT_ROOT', root), \
                 patch.object(notifications, 'SENDER', Path(__file__)), \
                 patch.object(notifications.subprocess, 'run') as send, \
                 contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(notifications.notify(root/'tracking/checks/ping.json', source=Source()), 0)
                send.assert_not_called()
            self.assertFalse((root/'tracking').exists())

    def test_database_keeps_only_duplicate_guard_without_local_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            records = {}
            documents = {'tracking/checks/ping.json': json.dumps(self.check),
                         'tracking/bets.json': json.dumps(self.ledger),
                         'tracking/email_recipients.json': json.dumps(['test@example.com'])}
            class Source:
                def read_bytes(self, path): return documents[str(path.resolve().relative_to(root.resolve()))].encode()
                def claim_document(self, key, text):
                    if key in records: return {'claimed': False, 'value': records[key]}
                    records[key] = text
                    return {'claimed': True}
                def write_document(self, key, text): raise AssertionError('No email receipt may be written')
            with patch.object(notifications, 'PROJECT_ROOT', root), \
                 patch.object(notifications, 'SENDER', Path(__file__)), \
                 patch.object(notifications.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as send, \
                 contextlib.redirect_stdout(io.StringIO()):
                for _ in range(2):
                    self.assertEqual(notifications.notify(root/'tracking/checks/ping.json', source=Source()), 0)
                send.assert_called_once()
            self.assertEqual(json.loads(records['tracking/notifications/ping.json']), {'attempted': True})
            self.assertFalse((root/'tracking').exists())


if __name__ == '__main__':
    unittest.main()
