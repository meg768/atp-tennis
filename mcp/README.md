# ATP Tennis MCP

MCP-server for `atp-tennis`.

Den anropar det lokala HTTP-API:t som redan exponeras av:

```bash
node atp.js serve
```

## Install

```bash
cd /Users/magnus/Documents/GitHub/atp-tennis/mcp
npm install
```

## Start

```bash
cd /Users/magnus/Documents/GitHub/atp-tennis/mcp
npm start
```

## Tools

- `ping`
- `get_live_matches`
- `get_rankings`
- `get_oddset`
- `get_upcoming_matches`
- `get_calendar`
- `get_match_odds`

## Config

- `ATP_BASE_URL` default: `http://127.0.0.1:3004`
- `ATP_HTTP_TIMEOUT_MS` default: `15000`
