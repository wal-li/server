import colors from 'colors';
import { createServer as createLegacyServer } from 'node:http';
import { DEFAULT_HOST, DEFAULT_PORT, DEFAULT_NAME } from './constants.js';
import { createLogger } from './logger.js';
import { prepareInput } from './input.js';
import { sendOutput } from './output.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { Router } from './router.js';

export class Server extends Router {
  constructor(config = {}) {
    super();

    this.port = config.port || DEFAULT_PORT;
    this.host = config.host || DEFAULT_HOST;
    this.name = config.name || DEFAULT_NAME;
    this.debug = config.debug || false;

    this.isRunning = false;
    this.logger = createLogger(this.name);
    this.legacyServer = createLegacyServer(this.serverCallback.bind(this));

    this.legacyServer.on('error', (err) =>
      this.logger.error(this.debug ? err : err.message)
    );
  }

  get address() {
    return `http://${this.host}:${this.port}`;
  }

  async serverCallback(req, res) {
    let isResponse = false;

    try {
      const ltime = new Date();

      // main handle
      const input = await prepareInput(req);
      let output;
      try {
        output = (await this.handleNext(0, input)) || {};
      } catch (err) {
        output = { body: err };
        this.legacyServer.emit('error', err);
      }
      isResponse = true;
      const nextOutput = sendOutput(res, output);

      // logging
      const ctime = new Date();
      this.logger.http(
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
      this.logger.error(reqErr);
    }
  }

  async handleNext(startIndex, input) {
    for (let i = startIndex; i < this.routes.length; i++) {
      const route = this.routes[i];

      if (
        route.methods.indexOf('all') === -1 &&
        route.methods.indexOf(input.method.toLowerCase()) === -1
      )
        continue;

      const result = route.match(input.path);
      if (!result) continue;

      input.params = result.params;
      return await route.handle(input, () => this.handleNext(i + 1, input));
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) return resolve();

      this.legacyServer.on('error', (err) => {
        if (!this.isRunning) reject(err);
      });

      this.legacyServer.listen(this.port, this.host, () => {
        this.isRunning = true;

        this.logger.info(`Server is running at ${this.address}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.isRunning) return resolve();

      this.legacyServer.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }
}

export function createServer(config = {}) {
  return new Server(config);
}
