import Koa from 'koa';
import applyQueryString from 'koa-qs';
import Router from '@koa/router';
import getPort from 'get-port';
import colors from 'colors';
import { createServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import { koaBody } from 'koa-body';
import { createLogger, logMiddleware } from './logger.js';

export class Server {
  constructor(port, name = 'server') {
    // config
    this.port = port;
    this.name = name;

    // server
    this.server = new Koa();
    this.router = new Router();
    this.logger = createLogger(name);
    this.listener = null;
    this.http = createServer(this.server.callback());
    this.io = new IOServer(this.http, {
      cors: {
        origin: '*'
      }
    });

    // middlewares
    applyQueryString(this.server);
    this.server.use(koaBody({ multipart: true }));
    this.server.use(logMiddleware.bind(this));
  }

  get netaddr() {
    return `127.0.0.1:${this.port}`;
  }

  get address() {
    return `http://${this.netaddr}`;
  }

  async start() {
    this.port ||= await getPort();

    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());

    await new Promise((resolve) => {
      this.listener = this.http.listen(this.port, () => {
        resolve();
        this.logger.info(
          colors.green(`Server is ${colors.bold('running')} at ${colors.yellow(this.address)}`)
        );
      });
    });
  }

  async stop() {
    if (this.listener) {
      await this.listener.close();
      this.logger.info(
        colors.red(`Server is ${colors.bold('stopped')} at ${colors.yellow(this.address)}`)
      );
    }
  }
}
