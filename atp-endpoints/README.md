# ATP Endpoints

This file documents ATP endpoints and related URL patterns (updated 2026-02-27).

## Node Example

- Script: [fetch-endpoint.js](./examples/fetch-endpoint.js)
- Default (fetch Jannik Sinner activity):
  - `node atp-endpoints/examples/fetch-endpoint.js`
- Custom endpoint + output file:
  - `node atp-endpoints/examples/fetch-endpoint.js "https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100" "atp-endpoints/examples/rankings.latest.json"`

## Endpoints

### Rankings
- `GET https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
- Required query params: `fromRank`, `toRank`
- Example: `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
- Example JSON: [rankings.ranksglrollrange.1-100.example.json](./examples/rankings.ranksglrollrange.1-100.example.json)

### Player Activity
- `GET https://www.atptour.com/en/-/www/activity/last/{player}`
- Example (`{player}=S0AG`, Jannik Sinner): `https://www.atptour.com/en/-/www/activity/last/S0AG`
- Example JSON: [activity.last.S0AG.example.json](./examples/activity.last.S0AG.example.json)

### Event Results Archive
- `GET https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
- Required query params: `eventyear`, `eventid`
- Example JSON: [scores.resultsarchive.2025-336.example.json](./examples/scores.resultsarchive.2025-336.example.json)

### Player Profile
- `GET https://www.atptour.com/en/-/www/players/hero/{player}`
- Example (`{player}=S0AG`, Jannik Sinner): `https://www.atptour.com/en/-/www/players/hero/S0AG`
- Example JSON: [players.hero.S0AG.example.json](./examples/players.hero.S0AG.example.json)

### Stats Leaderboard
- `GET https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
- Path param: `{type}` (`pressure`, `serve`, `return`)
- Example JSON: [statsleaderboard.pressure.example.json](./examples/statsleaderboard.pressure.example.json)

### Live Matches
- `GET https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`
- Query param: `scoringTournamentLevel` (commonly `tour`)
- Example JSON: [livematches.website.tour.example.json](./examples/livematches.website.tour.example.json)

### Masters 1000 Tournament Explorer
- `GET https://www.atptour.com/-/tournaments/explore/1000`
- Example JSON: [tournaments.explore.1000.example.json](./examples/tournaments.explore.1000.example.json)

### Tournament Calendar
- `GET https://www.atptour.com/en/-/tournaments/calendar/tour`
- Returns ATP Tour calendar/schedule data
- Example JSON: [tournaments.calendar.tour.example.json](./examples/tournaments.calendar.tour.example.json)

### Country Flag Asset
- `GET https://www.atptour.com/en/~/media/images/flags/{COUNTRY}.svg`
- `{COUNTRY}` format: 3-letter uppercase country code (e.g. `SWE`, `USA`, `SRB`)
- Returns SVG, not JSON
- Example JSON (request/URL pattern): [flags.country.request.example.json](./examples/flags.country.request.example.json)

## Derived ATP URL Patterns

- `https://www.atptour.com{ScRelativeUrlPlayerProfile}`
- `http://atptour.com{TournamentUrl}`

## Common Request Headers

- `Referer: https://app.atptour.com/`
- `Origin: https://app.atptour.com`
