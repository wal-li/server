import { join } from 'node:path';
import { match } from 'path-to-regexp';
import { METHODS } from './constants.js';

/**
 * @typedef Route
 * @property {METHODS[]} methods
 * @property {string} path
 * @property {function} match - path-to-regex
 * @property {function} handle
 * @property {object} options
 */

/**
 * Manage the routing of incoming HTTP requests to the handlers.
 * @class
 * @example
 * import { Router } from '@wal-li/server';
 * const router = new Router();
 * @tutorial nested-routing
 */
export class Router {
  constructor() {
    /** @type {Route} */
    this.routes = [];
  }

  /**
   * Add routes to the router.
   * @param {METHODS[]} methods
   * @param {string[]} paths
   * @param {function[]} handlers
   * @param {object[]} options
   */
  addRoutes(methods, paths, handlers, options = {}) {
    for (const path of paths) {
      for (const handler of handlers) {
        if (handler instanceof Router) {
          for (const route of handler.routes) {
            const nextPath = join(
              '/',
              path.replace(/^\/+|\/+$/g, ''),
              route.path.replace(/^\/+|\/+$/g, '')
            );
            this.routes.push({
              methods: [...route.methods, ...methods],
              path: nextPath,
              matches: [
                // normal match
                match(nextPath, { decode: decodeURIComponent }),
                // use match
                ...(route.methods.length === 0
                  ? [
                      match(join(nextPath, '(.*)'), {
                        decode: decodeURIComponent
                      })
                    ]
                  : [])
              ],
              handle: route.handle,
              options
            });
          }
        } else {
          const nextPath = join('/', path.replace(/^\/+|\/+$/g, ''));
          this.routes.push({
            methods,
            path: nextPath,
            matches: [
              // normal match
              match(nextPath, { decode: decodeURIComponent }),
              // use match
              ...(methods.length === 0
                ? [
                    match(join(nextPath, '(.*)'), {
                      decode: decodeURIComponent
                    })
                  ]
                : [])
            ],
            handle: handler,
            options
          });
        }
      }
    }
  }
}

/**
 * Add routes to the router. If you use `use` method, the router will be pass the method check step in parent, just check in client. If you use `all` method, the router will match all incomming http request methods.
 * @memberof Router
 * @method &lt;METHODS&gt;
 * @param {...(string|function|object)} args - Depend on the type of arg, it can be:<br/>- `string` is methods<br/>- `function` is handlers<br/>- `object` is options<br/>. All options will be flatten.
 * @instance
 * @example
 *  router.use('/abc', async function(){ ... }, { cors: true })
 */

for (const method of METHODS)
  Router.prototype[method] = function (...args) {
    const paths = [];
    const handlers = [];
    const methods = method === 'use' ? [] : [method];
    let options = {};

    // handle args
    for (const arg of args) {
      const typeOfArg = typeof arg;
      if (typeOfArg === 'string') {
        paths.push(arg);
      } else if (typeOfArg === 'function' || arg instanceof Router) {
        handlers.push(arg);
      } else if (typeOfArg === 'object' && arg) {
        options = {
          ...options,
          ...arg
        };
      } else {
        throw new Error(`Invalid argument '${typeOfArg}'`);
      }
    }

    if (paths.length === 0) paths.push('/');

    this.addRoutes(methods, paths, handlers, options);
  };

export function createRouter() {
  return new Router();
}
