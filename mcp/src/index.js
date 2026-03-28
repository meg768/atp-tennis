import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

function logError(error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
}

process.on('uncaughtException', error => {
  logError(error);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  logError(error);
  process.exit(1);
});

const server = createServer();
const transport = new StdioServerTransport();

await server.connect(transport);
