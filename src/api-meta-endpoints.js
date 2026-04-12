const Api = require('./api');

class ApiMetaEndpoints extends Api {

	async fetch() {
		return {
			version: this.version,
			notes: [
				'Endpoints are described as paths only.',
				'Resolve them relative to the current host where this service is running.'
			],
			endpoints: {
				'/ok': {
					method: 'GET',
					description: 'Simple health check.',
					response: {
						shape: 'object',
						example: { message: 'I am OK' }
					}
				},
				'/api/ping': {
					method: 'GET',
					description: 'Lightweight liveness payload with service version.',
					response: {
						shape: 'object',
						fields: {
							message: 'string',
							version: 'string'
						}
					}
				},
				'/api/meta/schema.sql': {
					method: 'GET',
					description: 'Returns the raw database schema SQL file, including comments and DDL.'
				},
				'/api/flags/:code.svg': {
					method: 'GET',
					params: {
						code: 'string, required, ATP-style three-letter country code such as CZE or ITA'
					},
					description: 'Returns a country flag SVG from the local flags directory. If a flag asset is missing, returns a plain white fallback SVG.',
					response: {
						shape: 'raw svg'
					}
				},
				'/api/meta/endpoints': {
					method: 'GET',
					description: 'Returns machine-readable metadata about the service endpoints.'
				},
				'/api/matches/live': {
					method: 'GET',
					description: 'Normalized ATP live matches from ATP Tour live data.'
				},
				'/api/player/rankings': {
					method: 'GET',
					query: {
						top: 'number, optional'
					},
					description: 'Current ATP rankings. Defaults to top 100.'
				},
				'/api/player/search': {
					method: 'GET',
					query: {
						term: 'string, required'
					},
					description: 'Searches player candidates through PLAYER_SEARCH.',
					response: {
						shape: 'array'
					}
				},
				'/api/player/lookup': {
					method: 'GET',
					query: {
						query: 'string, required',
						term: 'string, optional alias',
						searchTerm: 'string, optional alias'
					},
					description: 'Resolves a best-match player id through PLAYER_LOOKUP.',
					response: {
						shape: 'array',
						example: [{ id: 'RH16' }]
					}
				},
				'/api/oddset': {
					method: 'GET',
					query: {
						raw: 'boolean-like, optional'
					},
					description: 'Normalized Oddset ATP match feed. With raw=1, returns the raw upstream payload.',
					response: {
						shape: 'array',
						fields: {
							id: 'number',
							start: 'string (ISO datetime)',
							tournament: 'string',
							state: 'string',
							score: 'string|null',
							playerA: {
								id: 'string|null',
								name: 'string',
								odds: 'number|null'
							},
							playerB: {
								id: 'string|null',
								name: 'string',
								odds: 'number|null'
							}
						}
					}
				},
				'/api/oddset/odds': {
					method: 'GET',
					query: {
						playerA: 'string, required, ATP id or player name',
						playerB: 'string, required, ATP id or player name',
						requestTimeoutMs: 'number, optional',
						url: 'string, optional upstream override',
						matchesUrl: 'string, optional primary ATP matches override',
						openUrl: 'string, optional live-open fallback override',
						upcomingUrl: 'string, optional tennis-all upcoming override'
					},
					description: 'Returns Svenska Spel Oddset decimal odds for a specific matchup.',
					response: {
						shape: 'array',
						example: [1.6, 2.33],
						notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
					}
				},
				'/api/odds': {
					method: 'GET',
					query: {
						playerA: 'string, required, ATP id or player name',
						playerB: 'string, required, ATP id or player name',
						surface: 'string, optional'
					},
					description: 'Returns model prices for a specific matchup.',
					response: {
						shape: 'array',
						example: [1.63, 2.29],
						notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
					}
				},
				'/api/tennis-abstract/odds': {
					method: 'GET',
					query: {
						playerA: 'string, required, ATP id or player name',
						playerB: 'string, required, ATP id or player name',
						surface: 'string, optional, Hard/Clay/Grass',
						bestOf: 'number, optional, defaults to 3'
					},
					description: 'Returns Tennis Abstract-inspired matchup odds with a 5% margin added to the model probabilities.',
					response: {
						shape: 'array',
						example: [1.68, 2.24],
						notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
					}
				},
				'/api/events/calendar': {
					method: 'GET',
					description: 'Normalized ATP calendar.',
					response: {
						shape: 'object',
						fields: {
							events: 'array'
						}
					}
				},
				'/api/query': {
					method: 'POST',
					body: {
						sql: 'string, required, read-only SQL only'
					},
					description: 'Runs read-only SQL against the ATP database.',
					response: {
						shape: 'array'
					}
				}
			}
		};
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiMetaEndpoints;
