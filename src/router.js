import { join } from 'node:path';
import { match } from 'path-to-regexp';
import { ROUTE_METHODS } from './constants.js';

export class Router {
  constructor() {
    this.routes = [];
  }
}

for (const method of ROUTE_METHODS)
  Router.prototype[method] = function (...args) {
    const paths = [];
    const handlers = [];

    // handle args
    for (const arg of args) {
      const typeOfArg = typeof arg;
      if (typeOfArg === 'string') {
        paths.push(arg);
      } else if (typeOfArg === 'function' || arg instanceof Router) {
        handlers.push(arg);
      } else {
        throw new Error(`Invalid argument '${typeOfArg}'`);
      }
    }

    if (paths.length === 0) paths.push('/');

    // append routes
    for (const path of paths) {
      for (const handler of handlers) {
        if (handler instanceof Router) {
          for (const route of handler.routes) {
            const nextPath = join(path, route.path);
            this.routes.push({
              methods: [...route.methods, method],
              path: nextPath,
              match: match(nextPath, { decode: decodeURIComponent }),
              handle: route.handle
            });
          }
        } else {
          this.routes.push({
            methods: [method],
            path,
            match: match(path, { decode: decodeURIComponent }),
            handle: handler
          });
        }
      }
    }
  };

export function createRouter() {
  return new Router();
}
