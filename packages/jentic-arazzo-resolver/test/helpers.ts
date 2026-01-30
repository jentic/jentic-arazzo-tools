import fs from 'node:fs';
import http, { Server } from 'node:http';
import path from 'node:path';

export type ServerTerminable = Server & {
  terminate: () => Promise<ServerTerminable>;
  port: number;
};

export const loadJsonFile = (filePath: string): unknown => {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

export const createHTTPServer = ({
  port = 0,
  cwd = process.cwd(),
} = {}): Promise<ServerTerminable> => {
  return new Promise((resolve, reject) => {
    const server: ServerTerminable = http.createServer((req, res) => {
      const filePath = path.join(cwd, req.url || '/favicon.ico');

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const data = fs.readFileSync(filePath).toString();
      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === '.yaml' || ext === '.yml' ? 'application/yaml' : 'application/json';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }) as ServerTerminable;

    server.terminate = () =>
      new Promise((resolveTerminate) => {
        server.close(() => resolveTerminate(server));
      });

    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      const address = server.address();
      server.port = typeof address === 'object' && address !== null ? address.port : port;
      resolve(server);
    });
  });
};
