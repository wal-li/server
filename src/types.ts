import { MatchFunction } from 'path-to-regexp';
import { Method } from './enum';

export type Options = {
  cors?: boolean;
  meta?: object;
};

export type Handler = (input?: any, next?: any) => Promise<any>;

export interface Route {
  path: string;
  methods: Method[];
  matches: MatchFunction<object>[];
  handler: Handler;
  options: Options;
}

export type ServerConfig = {
  host?: string;
  port?: number;
  name?: string;
  debug?: boolean;
  cors?: boolean;
};
