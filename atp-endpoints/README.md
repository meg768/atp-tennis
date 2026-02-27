# ATP Endpoints

This file documents ATP endpoints and related URL patterns (updated 2026-02-27).

## ATP APIs and Feeds

- `GET https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
  - ATP rankings feed.
  - Required query params:
    - `fromRank` (integer, inclusive start rank, typically `>= 1`)
    - `toRank` (integer, inclusive end rank, typically `>= fromRank`)
  - Example: `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
  - Example JSON: [rankings-ranksglrollrange.example.json](./examples/rankings-ranksglrollrange.example.json)
- `GET https://www.atptour.com/en/-/www/activity/last/{player}`
  - Player activity feed.
- `GET https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
  - Tournament results archive.
  - Query params: `eventyear`, `eventid`.
- `GET https://www.atptour.com/en/-/www/players/hero/{player}`
  - Player profile data.
- `GET https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
  - Stats leaderboard (`type`: `pressure`, `serve`, `return`).
- `GET https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`
  - Live match feed.
- `GET https://www.atptour.com/-/tournaments/explore/1000`
  - Tournament explorer feed/page.
- `GET https://www.atptour.com/en/-/tournaments/calendar/tour`
  - ATP Tour calendar feed endpoint.
  - Interpretation: schedule/calendar content for ATP Tour events.
  - Comment: useful for event discovery and schedule sync.
  - Example JSON: [calendar-tour.example.json](./examples/calendar-tour.example.json)
- `GET https://www.atptour.com/en/~/media/images/flags/{COUNTRY}.svg`
  - Country flag SVG files.

## Derived ATP URL Patterns

- `https://www.atptour.com{ScRelativeUrlPlayerProfile}`
  - Pattern for full player profile URL built from relative path data.
- `http://atptour.com{TournamentUrl}`
  - Pattern for tournament pages built from relative path data.

## Common Request Headers

Commonly required in ATP browser-like requests:

- `Referer: https://app.atptour.com/`
- `Origin: https://app.atptour.com`
