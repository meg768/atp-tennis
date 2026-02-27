# ATP Endpoints

This file documents ATP endpoints and related URL patterns (updated 2026-02-27).

## ATP APIs and Feeds

- `GET https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
  - ATP rankings feed.
  - Required query params:
    - `fromRank` (integer, inclusive start rank, typically `>= 1`)
    - `toRank` (integer, inclusive end rank, typically `>= fromRank`)
  - Example: `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
  - Example JSON: [rankings.ranksglrollrange.1-100.raw.example.json](./examples/rankings.ranksglrollrange.1-100.raw.example.json)
- `GET https://www.atptour.com/en/-/www/activity/last/{player}`
  - Player activity feed.
  - Example JSON: [activity.last.s0ag.raw.example.json](./examples/activity.last.s0ag.raw.example.json)
- `GET https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
  - Tournament results archive.
  - Query params: `eventyear`, `eventid`.
  - Example JSON: [scores.resultsarchive.2025-336.raw.example.json](./examples/scores.resultsarchive.2025-336.raw.example.json)
- `GET https://www.atptour.com/en/-/www/players/hero/{player}`
  - Player profile data.
  - Example JSON: [players.hero.s0ag.raw.example.json](./examples/players.hero.s0ag.raw.example.json)
- `GET https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
  - Stats leaderboard (`type`: `pressure`, `serve`, `return`).
  - Example JSON: [statsleaderboard.pressure.raw.example.json](./examples/statsleaderboard.pressure.raw.example.json)
- `GET https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`
  - Live match feed.
  - Query params: `scoringTournamentLevel` (commonly `tour`).
  - Example JSON: [livematches.website.tour.raw.example.json](./examples/livematches.website.tour.raw.example.json)
- `GET https://www.atptour.com/-/tournaments/explore/1000`
  - Tournament explorer feed/page.
  - Example JSON: [tournaments.explore.1000.raw.example.json](./examples/tournaments.explore.1000.raw.example.json)
- `GET https://www.atptour.com/en/-/tournaments/calendar/tour`
  - ATP Tour calendar feed endpoint.
  - Interpretation: schedule/calendar content for ATP Tour events.
  - Comment: useful for event discovery and schedule sync.
  - Example JSON: [tournaments.calendar.tour.raw.example.json](./examples/tournaments.calendar.tour.raw.example.json)
- `GET https://www.atptour.com/en/~/media/images/flags/{COUNTRY}.svg`
  - Country flag SVG files.
  - Example JSON (request/URL pattern): [flags.country.request.example.json](./examples/flags.country.request.example.json)

## Derived ATP URL Patterns

- `https://www.atptour.com{ScRelativeUrlPlayerProfile}`
  - Pattern for full player profile URL built from relative path data.
- `http://atptour.com{TournamentUrl}`
  - Pattern for tournament pages built from relative path data.

## Common Request Headers

Commonly required in ATP browser-like requests:

- `Referer: https://app.atptour.com/`
- `Origin: https://app.atptour.com`
