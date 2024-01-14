import colors from 'colors';
import { createServer as createLegacyServer, METHODS } from 'node:http';
import { DEFAULT_HOST, DEFAULT_PORT, DEFAULT_NAME } from './constants.js';
import { match } from 'path-to-regexp';
import { createLogger } from './logger.js';
import { prepareInput } from './input.js';
import { sendOutput } from './output.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

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

      const result = route.match(input.path);
      if (!result) continue;

      input.params = result.params;
      return await route.handle(input, () => handleNext(i + 1, input));
    }
  };

  const legacyServer = createLegacyServer(async function (req, res) {
    let isResponse = false;

    try {
      const ltime = new Date();

      // main handle
      const input = await prepareInput(req);
      let output;
      try {
        output = (await handleNext(0, input)) || {};
      } catch (err) {
        output = { body: err };
        this.emit('error', err);
      }
      isResponse = true;
      const nextOutput = sendOutput(res, output);

      // logging
      const ctime = new Date();
      logger.http(
        [
          colors.magenta(input.method),
          Math.floor(nextOutput.status / 100) === 2
            ? colors.green(nextOutput.status)
            : colors.red(nextOutput.status),
          colors.white(input.path),
          colors.yellow(`${ctime - ltime}ms`)
        ].join(' ')
      );
    } catch (reqErr) {
      if (!isResponse) {
        res.writeHead(StatusCodes.INTERNAL_SERVER_ERROR);
        res.end(reqErr.message || ReasonPhrases.INTERNAL_SERVER_ERROR);
      }
      logger.error(reqErr);
    }
  });

  const logger = createLogger(name);

  let isRunning = false;

  legacyServer.on('error', (err) => logger.error(debug ? err : err.message));

  return {
    address: `http://${host}:${port}`,

    start() {
      return new Promise((resolve, reject) => {
        if (isRunning) return resolve();

        legacyServer.on('error', (err) => {
          if (!isRunning) reject(err);
        });

        legacyServer.listen(port, host, () => {
          isRunning = true;

          logger.info(`Server is running at ${this.address}`);
          resolve();
        });
      });
    },

    stop() {
      return new Promise((resolve) => {
        if (!isRunning) return resolve();

        legacyServer.close(() => {
          isRunning = false;
          resolve();
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

            if (paths.length === 0) paths.push('/');

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
