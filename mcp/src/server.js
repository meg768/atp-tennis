import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getBaseUrl,
  getCalendar,
  getLiveMatches,
  getMatchOdds,
  getOddset,
  getUpcomingMatches,
  getRankings,
  ping
} from './api.js';

function toToolResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function sortByStartAscending(matches) {
  return [...matches].sort((left, right) => {
    const leftTime = Date.parse(left?.start || '');
    const rightTime = Date.parse(right?.start || '');

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }

    if (Number.isNaN(leftTime)) {
      return 1;
    }

    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return leftTime - rightTime;
  });
}

function filterByTournament(matches, tournament) {
  if (!tournament) {
    return matches;
  }

  const normalizedTournament = tournament.trim().toLowerCase();

  if (!normalizedTournament) {
    return matches;
  }

  return matches.filter(match =>
    String(match?.tournament || '')
      .toLowerCase()
      .includes(normalizedTournament)
  );
}

export function createServer() {
  const server = new McpServer({
    name: 'atp-tennis-mcp',
    version: '0.1.0'
  });

  server.tool(
    'ping',
    'Kontrollera att den lokala atp-tennis-backenden svarar.',
    async () => toToolResult(await ping())
  );

  server.tool(
    'get_live_matches',
    'Hamta normaliserade ATP live-matcher fran backendens /api/live.',
    async () => toToolResult(await getLiveMatches())
  );

  server.tool(
    'get_rankings',
    'Hamta ATP-rankingen fran backendens /api/rankings.',
    {
      top: z.number().int().positive().max(500).optional()
    },
    async ({ top }) => toToolResult(await getRankings({ top }))
  );

  server.tool(
    'get_oddset',
    'Hamta ATP-matcher med odds fran backendens /api/oddset.',
    {
      states: z.array(z.enum(['STARTED', 'NOT_STARTED'])).optional(),
      raw: z.boolean().optional(),
      requestTimeoutMs: z.number().int().positive().max(60000).optional()
    },
    async ({ states, raw, requestTimeoutMs }) =>
      toToolResult(await getOddset({ states, raw, requestTimeoutMs }))
  );

  server.tool(
    'get_upcoming_matches',
    'Hamta kommande ATP-matcher med odds. Kan filtreras pa turnering och begransas i antal.',
    {
      tournament: z.string().min(1).optional(),
      limit: z.number().int().positive().max(50).optional(),
      requestTimeoutMs: z.number().int().positive().max(60000).optional()
    },
    async ({ tournament, limit, requestTimeoutMs }) => {
      const matches = await getUpcomingMatches({ requestTimeoutMs });
      const filteredMatches = filterByTournament(matches, tournament);
      const sortedMatches = sortByStartAscending(filteredMatches);

      return toToolResult(limit ? sortedMatches.slice(0, limit) : sortedMatches);
    }
  );

  server.tool(
    'get_calendar',
    'Hamta ATP-kalendern fran backendens /api/calendar.',
    async () => toToolResult(await getCalendar())
  );

  server.tool(
    'get_match_odds',
    'Hamta modellodds for en specifik ATP-match fran backendens /api/odds/:playerA/:playerB.',
    {
      playerA: z.string().min(1),
      playerB: z.string().min(1),
      surface: z.enum(['Hard', 'Clay', 'Grass']).optional()
    },
    async ({ playerA, playerB, surface }) =>
      toToolResult(await getMatchOdds({ playerA, playerB, surface }))
  );

  server.resource('backend-config', 'atp://backend/config', async uri => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ baseUrl: getBaseUrl() }, null, 2)
      }
    ]
  }));

  return server;
}
