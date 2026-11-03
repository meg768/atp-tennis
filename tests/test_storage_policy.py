import json
import unittest
from scripts.storage_policy import retain, compact, overview


class StoragePolicyTests(unittest.TestCase):
    def test_presentation_and_archive_data_are_not_retained(self):
        for key in ['analysis/ping/poster-data.json','analysis/ping/imagegen-prompt.txt',
                    'analysis/ping/mail-preview.txt','analysis/ping/delivery-validation.json',
                    'output/posters/data.json','backups/rows.json','cleanup/old.json',
                    'tracking/overview.md','tracking/email_recipients.json','CONTEXT.md']:
            self.assertFalse(retain(key),key)
        for key in ['tracking/bets.json','tracking/checks/ping.json',
                    'analysis/ping/assessment.md','analysis/ping/candidate-decisions.json']:
            self.assertTrue(retain(key),key)

    def test_odds_compaction_preserves_both_prices_ids_and_observation_time(self):
        winner=dict(id=123,criterion={'englishLabel':'Match Odds'},outcomes=[
            dict(id=1,participant='A',odds=2500,status='OPEN'),
            dict(id=2,participant='B',odds=1500,status='OPEN')])
        event=dict(id=42,homeName='A',awayName='B',state='NOT_STARTED',start='time',group='Paris',tags=['extra'])
        value=dict(checked_at='timestamp',source='provider',response=dict(events=[dict(event=event,betOffers=[winner,dict(criterion={'englishLabel':'Total Games'})],liveData={'extra':'discard'})]))
        output=json.loads(compact('analysis/ping/final-odds.json',json.dumps(value)))
        self.assertEqual(output['checked_at'],'timestamp')
        self.assertEqual(output['response']['events'][0]['betOffers'],[winner])
        self.assertNotIn('tags',output['response']['events'][0]['event'])
        self.assertNotIn('liveData',output['response']['events'][0])

    def test_original_forecast_text_is_never_reformatted(self):
        text='Åäö\nEgen chans 44 %, odds 2,50.\n'
        self.assertEqual(compact('analysis/ping/assessment.md',text),text)

    def test_overview_is_derived_and_keeps_settled_and_open_bets(self):
        ledger=dict(portfolio_id='paper',bets=[dict(bet_id='a',player_name='A',opponent_name='B',odds='2.5',stake_sek='100')])
        check=dict(portfolio_id='paper',checked_at='2026-10-31T22:00:00+01:00',realized_net_sek='-100',open_stake_sek='0',settled_match_count=1,total_bet_count=1,bets=[dict(bet_id='a',status='lost',score='4-6 4-6',payout_sek='0',net_sek='-100')])
        text=overview({'tracking/bets.json':json.dumps(ledger),'tracking/checks/ping.json':json.dumps(check)})
        self.assertIn('4-6 4-6',text)
        self.assertIn('lost',text)
        self.assertIn('-100',text)
