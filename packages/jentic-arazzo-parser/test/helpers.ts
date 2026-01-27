import fs from 'node:fs';
import http, { Server } from 'node:http';
import path from 'node:path';

export type ServerTerminable = Server & {
  terminate: () => Promise<ServerTerminable>;
};

export const createHTTPServer = ({ port = 8123, cwd = process.cwd() } = {}): ServerTerminable => {
  const server: ServerTerminable = http.createServer((req, res) => {
    const filePath = path.join(cwd, req.url || '/favicon.ico');

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const data = fs.readFileSync(filePath).toString();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  }) as ServerTerminable;

  server.listen(port);

  server.terminate = () =>
    new Promise((resolve) => {
      server.close(() => resolve(server));
    });

  return server;
};
