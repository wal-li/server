import colors from 'colors';
import { createServer as createLegacyServer, METHODS } from 'node:http';
import { DEFAULT_HOST, DEFAULT_PORT, DEFAULT_NAME } from './constants.js';
import { match } from 'path-to-regexp';
import { createLogger } from './logger.js';
import { prepareInput } from './input.js';
import { sendOutput } from './output.js';

export function createServer(config = {}) {
  const port = config.port || DEFAULT_PORT;
  const host = config.host || DEFAULT_HOST;
  const name = config.name || DEFAULT_NAME;
  const debug = config.debug || false;

  const routes = [];

  const handleNext = async (startIndex, input) => {
    for (let i = startIndex; i < routes.length; i++) {
      const route = routes[i];

      if (
        route.method !== 'all' &&
        route.method !== 'use' &&
        route.method !== input.method.toLowerCase()
      )
        continue;

      const params = route.match(input.path);
      if (!params) continue;

      input.params = params;
      return await route.handle(input, () => handleNext(i + 1, input));
    }
  };

  const legacyServer = createLegacyServer(async function (req, res) {
    const ltime = new Date();

    // main handle
    const input = prepareInput(req);
    let output;
    try {
      output = (await handleNext(0, input)) || {
        status: 404,
        body: 'Not Found'
      };
    } catch (err) {
      output = {
        status: 500,
        body: 'Internal Server Error'
      };
      this.emit('error', err);
    }
    sendOutput(res, output);

    // logging
    const ctime = new Date();
    logger.http(
      [
        colors.magenta(input.method),
        Math.floor(output.status / 100) === 2
          ? colors.green(output.status)
          : colors.red(output.status),
        colors.white(input.path),
        colors.yellow(`${ctime - ltime}ms`)
      ].join(' ')
    );
  });

  const logger = createLogger(name);

  let isRunning = false;

  legacyServer.on('error', (err) => logger.error(debug ? err : err.message));

  return {
    address: `http://${host}:${port}`,

    start() {
      return new Promise((resolve, reject) => {
        if (isRunning) return resolve();

        legacyServer.listen(port, host, (err) => {
          if (err) {
            return reject(err);
          }

          isRunning = true;

          logger.info(`Server is running at ${this.address}`);
          resolve();
        });
      });
    },

    stop() {
      return new Promise((resolve, reject) => {
        if (!isRunning) return resolve();

        legacyServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            isRunning = false;
            resolve();
          }
        });
      });
    },

    ...[...METHODS, 'all', 'use']
      .map((method) => method.toLowerCase())
      .map(function (method) {
        return {
          [method]: (...args) => {
            const paths = [];
            const handlers = [];

            // handle args
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

            // append routes
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
