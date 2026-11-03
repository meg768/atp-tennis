"""Only fundamental betting records may be retained in bets.data."""
import json
from pathlib import PurePosixPath

RECIPIENTS = ['magnus.egelberg@gmail.com', 'magnus@egelberg.se']
ANALYSIS_FILES = {
    'assessment.md', 'historical-assessment.txt', 'candidate-decisions.json',
    'own-assessments.json', 'independent-assessments.json', 'probabilities.json',
    'probability.json', 'new-bet-assessment.json', 'picks.json', 'candidates.json',
    'candidate-screening.json', 'screening.json', 'candidate-detail.json',
    'ta.json', 'ta-priced.json', 'ta-complete.json', 'events.json',
    'new-settlements.json', 'results.json', 'atp-result-verification.json',
    'result-verification.json', 'declined-follow-up.json', 'registration.json',
    'final-odds.json', 'final-odds-check.json', 'probability.json',
    'svenskaspel.json', 'svenskaspel-raw.json', 'oddset.json', 'initial-odds.json',
    'pre-report-odds.json', 'recheck-odds.json', 'ta-priced.json',
    'tennisabstract-forecast-rows.json', 'tennisabstract-elo-rows.json',
    'comparison.json', 'comparison-with-previous-ping.json',
    'candidate-status.json', 'verified-portfolio.json', 'open-market-observations.json',
}


def retain(key):
    p = PurePosixPath(key)
    if key in ('tracking/bets.json', 'tracking/settlements.jsonl',
               'tracking/retrospectives.json', 'tracking/declined_matches.jsonl'):
        return True
    if key.startswith(('tracking/checks/', 'tracking/notifications/')):
        return key.endswith('.json')
    if key.startswith('tracking/archive/'):
        return p.name in ('bets.json','settlements.jsonl','retrospectives.json') or '/checks/' in key
    if key.startswith('revisions/tracking/'):
        return any('/'+name+'/' in key for name in ('bets.json','settlements.jsonl','retrospectives.json','declined_matches.jsonl'))
    return key.startswith('analysis/') and p.name in ANALYSIS_FILES


def compact(key, text):
    """Winner-market odds are evidence; unrelated markets and feeds are not."""
    if PurePosixPath(key).name not in ('final-odds.json','final-odds-check.json','svenskaspel.json','svenskaspel-raw.json','oddset.json','initial-odds.json','pre-report-odds.json','recheck-odds.json'):
        return text
    try: value = json.loads(text)
    except (ValueError, TypeError): return text
    if not isinstance(value,dict): return text
    payload=value.get('response',value)
    if not isinstance(payload,dict) or not isinstance(payload.get('events'),list): return text
    matches = []
    for item in payload.get('events',[]):
        event = {k:v for k,v in item['event'].items() if k in ('id','homeName','awayName','name','group','start','state')}
        offers = []
        for offer in item.get('betOffers',[]):
            if offer.get('criterion',{}).get('englishLabel') != 'Match Odds': continue
            offers.append({k:v for k,v in offer.items() if k in ('id','criterion','suspended','outcomes')})
        matches.append(dict(event=event,betOffers=offers))
    return json.dumps(dict(checked_at=value.get('checked_at'),source=value.get('source'),response=dict(events=matches)),ensure_ascii=False)


def overview(documents):
    ledger = json.loads(documents['tracking/bets.json'])
    checks = [json.loads(v) for k,v in documents.items() if k.startswith('tracking/checks/')]
    check = max((c for c in checks if c.get('portfolio_id')==ledger['portfolio_id']),key=lambda c:c['checked_at'])
    observations = {o['bet_id']:o for o in check['bets']}
    lines=['# Pappersportfölj', '', 'Kontrollerad '+check['checked_at'],
           f"Netto {check['realized_net_sek']} kr | Öppen insats {check['open_stake_sek']} kr | Avgjorda {check['settled_match_count']} av {check['total_bet_count']}", '',
           '| Vald spelare | Motståndare | Odds | Insats | Resultat | Utfall | Utbetalning | Netto |',
           '|---|---|---:|---:|---|---|---:|---:|']
    for bet in ledger['bets']:
        o=observations[bet['bet_id']]
        lines.append('| '+' | '.join(str(v) for v in [bet['player_name'],bet['opponent_name'],bet['odds'],bet['stake_sek'],o.get('score') or '—',o['status'],o.get('payout_sek','—'),o.get('net_sek','—')])+' |')
    return '\n'.join(lines)+'\n'
