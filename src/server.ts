import {
  createServer as createLegacyServer,
  IncomingMessage,
  Server as LegacyServer,
  ServerResponse
} from 'node:http';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import colors from 'colors/safe';
import caseless from 'caseless';

import { DEFAULT_SERVER_CONFIG } from './constants';
import { Router } from './router';
import { Options, ServerConfig } from './types';
import { createLogger } from './logger';
import { prepareInput } from './input';
import { sendOutput } from './output';
import { Method } from './enum';

export class Server extends Router {
  host: string;
  port: number;
  debug: boolean;
  cors: boolean;
  name: string;

  isRunning: boolean;
  logger: any;
  legacyServer: LegacyServer;

  constructor(config: ServerConfig = DEFAULT_SERVER_CONFIG) {
    super();

    this.host = config.host || DEFAULT_SERVER_CONFIG.host;
    this.port = config.port || DEFAULT_SERVER_CONFIG.port;
    this.debug = config.debug || DEFAULT_SERVER_CONFIG.debug;
    this.cors = config.cors || DEFAULT_SERVER_CONFIG.cors;
    this.name = config.name || DEFAULT_SERVER_CONFIG.name;

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

  async serverCallback(req: IncomingMessage, res: ServerResponse) {
    let isResponse = false;

    try {
      const ltime = +new Date();

      // main handle
      const input = await prepareInput(req);
      let output;

      // cors
      if (this.cors) {
        if (input.method === 'OPTIONS')
          output = {
            status: 204,
            ...this.postRoute({}, { cors: true })
          };
      }

      // routes
      if (!output)
        try {
          output = (await this.handleNext(0, input)) || {};
        } catch (err) {
          output = { body: err };
          this.legacyServer.emit('error', err);
        }

      output = this.postRoute(output, { cors: this.cors });
      isResponse = true;

      const nextOutput = sendOutput(res, output);

      // logging
      const ctime = +new Date();
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
    } catch (reqErr: any) {
      if (!isResponse) {
        res.writeHead(StatusCodes.INTERNAL_SERVER_ERROR);
        res.end(reqErr.message || ReasonPhrases.INTERNAL_SERVER_ERROR);
      }
      this.logger.error(reqErr);
    }
  }

  postRoute(output: any, options: Options = {}) {
    if (!output) output = {};

    const headers: any = caseless(output.headers || {});

    if (options.cors) {
      !headers.has('Access-Control-Allow-Origin') &&
        headers.set('Access-Control-Allow-Origin', '*');
      !headers.has('Access-Control-Allow-Headers') &&
        headers.set('Access-Control-Allow-Headers', '*');
      !headers.has('Access-Control-Allow-Methods') &&
        headers.set('Access-Control-Allow-Methods', '*');
    }

    output.headers = headers.dict;
    return output;
  }

  async handleNext(startIndex: number, input: any) {
    for (let i = startIndex; i < this.routes.length; i++) {
      const route = this.routes[i];

      // cors
      if (input.method.toLowerCase() === 'options' && route.options.cors) {
        return {
          status: 204,
          ...this.postRoute({}, { cors: true })
        };
      }

      if (
        route.methods.length > 0 &&
        route.methods.indexOf(Method.ALL) === -1 &&
        route.methods.indexOf(input.method.toLowerCase()) === -1
      )
        continue;

      let result;
      for (const match of route.matches) {
        result = match(input.path);
        if (result) break;
      }

      if (!result) continue;

      input.params = result.params;
      const output = await route.handler(input, () =>
        this.handleNext(i + 1, input)
      );

      return this.postRoute(output, {
        cors: this.cors || route.options.cors || false
      });
    }
  }

  start() {
    return new Promise<void>((resolve, reject) => {
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
    return new Promise<void>((resolve) => {
      if (!this.isRunning) return resolve();

      this.legacyServer.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }
}

export function createServer(config: ServerConfig = {}) {
  return new Server(config);
}
