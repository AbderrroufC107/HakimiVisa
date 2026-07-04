import { createServer } from 'vite';
const server = await createServer({
  root: process.cwd(),
  server: { port: 5173, host: '127.0.0.1', strictPort: true },
  logLevel: 'info',
});
await server.listen();
console.log(`Vite running on http://127.0.0.1:5173`);
process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
