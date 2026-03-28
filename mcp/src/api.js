const DEFAULT_BASE_URL = process.env.ATP_BASE_URL || 'http://127.0.0.1:3004';
const DEFAULT_TIMEOUT_MS = Number(process.env.ATP_HTTP_TIMEOUT_MS || 15000);

function getTimeoutMs(value) {
  const timeoutMs = Number(value);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
}

export function getBaseUrl() {
  return DEFAULT_BASE_URL;
}

function buildUrl(pathname, query = {}) {
  const baseUrl = getBaseUrl();
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = new URL(pathname.replace(/^\//, ''), base);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function fetchJson(pathname, { query = {}, timeoutMs } = {}) {
  const url = buildUrl(pathname, query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs(timeoutMs));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson && rawText ? JSON.parse(rawText) : rawText;

    if (!response.ok) {
      const detail = typeof body === 'string' ? body : body?.error || JSON.stringify(body);
      throw new Error(`HTTP ${response.status} from ${url}: ${detail}`);
    }

    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${getTimeoutMs(timeoutMs)} ms`);
    }

    throw new Error(`Failed to reach ${url}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function ping() {
  return fetchJson('/api/ping');
}

export function getLiveMatches() {
  return fetchJson('/api/live');
}

export function getRankings({ top } = {}) {
  return fetchJson('/api/rankings', {
    query: { top }
  });
}

export function getOddset({ states, raw, requestTimeoutMs } = {}) {
  const normalizedStates = Array.isArray(states) ? states.join(',') : undefined;

  return fetchJson('/api/oddset', {
    query: {
      states: normalizedStates,
      raw: raw ? 1 : undefined,
      requestTimeoutMs
    },
    timeoutMs: requestTimeoutMs
  });
}

export function getUpcomingMatches({ requestTimeoutMs } = {}) {
  return getOddset({
    states: ['NOT_STARTED'],
    requestTimeoutMs
  });
}

export function getCalendar() {
  return fetchJson('/api/calendar');
}

export function getMatchOdds({ playerA, playerB, surface } = {}) {
  if (!playerA || !playerB) {
    throw new Error('Both playerA and playerB are required.');
  }

  return fetchJson(`/api/odds/${encodeURIComponent(playerA)}/${encodeURIComponent(playerB)}`, {
    query: { surface }
  });
}
