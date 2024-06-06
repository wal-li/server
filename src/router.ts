import { join } from 'node:path';
import { match } from 'path-to-regexp';

import { Method } from './enum';
import { Handler, Options, Route } from './types';

export class BaseRouter {
  routes: Route[];

  constructor() {
    this.routes = [];
  }

  addRoutes(
    methods: Method[],
    paths: string[],
    handlers: (BaseRouter | Handler)[],
    options: Options = {}
  ) {
    for (const path of paths) {
      for (const handler of handlers) {
        if (handler instanceof BaseRouter) {
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
              handler: route.handler,
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
            handler,
            options
          });
        }
      }
    }
  }
}

type Router = BaseRouter & Record<Method, (...args: any) => void>;
export const Router = class Router extends BaseRouter {} as new (
  ...args: ConstructorParameters<typeof BaseRouter>
) => Router;

Object.values(Method).forEach(
  (method: any) =>
    (Router.prototype[method] = function (this: Router, ...args: any) {
      const paths: string[] = [];
      const handlers: Handler[] = [];
      const methods: Method[] = method === 'use' ? [] : [method];
      let options: Options = {};

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
    })
);

export function createRouter() {
  return new Router();
}
