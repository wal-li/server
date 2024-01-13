import { createServer as createLegacyServer, METHODS } from 'node:http';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants.js';
import { match } from 'path-to-regexp';

export function createServer(config = {}) {
  const port = config.port || DEFAULT_PORT;
  const host = config.host || DEFAULT_HOST;

  const routes = [];

  const handleNext = async (startIndex, input) => {
    for (let i = startIndex; i < routes.length; i++) {
      const route = routes[i];
      const params = route.match(input.path);
      if (params) {
        input.params = params;
        return await route.handle(input, () => handleNext(i + 1, input));
      }
    }
  };

  const legacyServer = createLegacyServer(async function (req, res) {
    try {
      const input = { path: req.url };
      const output = (await handleNext(0, input)) || { status: 404, body: 'Not Found' };
      res.writeHead(output.status);
      res.end(output.body);
    } catch (err) {
      this.emit('error', err);
    }
  });

  const log = console.log;

  legacyServer.on('error', log);

  return {
    address: `http://${host}:${port}`,

    start() {
      return new Promise((resolve, reject) => {
        legacyServer.listen(port, host, (err) => {
          if (err) {
            return reject(err);
          }

          log(`Server is running at ${this.address}`);
          resolve();
        });
      });
    },

    stop() {
      return new Promise((resolve, reject) => {
        legacyServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    ...[...METHODS, 'all', 'use']
      .map(function (method) {
        return {
          [method.toLowerCase()]: (...args) => {
            const paths = [];
            const handlers = [];
            for (const arg of args) {
              const typeOfArg = typeof arg;
              if (typeOfArg === 'string') {
                paths.push(arg);
              } else if (typeOfArg === 'function') {
                handlers.push(arg);
              } else {
                throw new Error(`Invalid argument '${typeOfArg}'`);
              }
            }
            for (const path of paths) {
              for (const handler of handlers) {
                routes.push({
                  method,
                  path,
                  match: match(path, { decode: decodeURIComponent }),
                  handle: handler
                });
              }
            }
          }
        };
      })
      .reduce((o, a) => ({ ...o, ...a }), {})
  };
}
