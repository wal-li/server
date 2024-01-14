import { METHODS } from 'node:http';

export const DEFAULT_PORT = 8080;
export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_NAME = 'server';

export const LOGGER_LEVELS = {
  http: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

export const ROUTE_METHODS = [
  ...METHODS.map((i) => i.toLowerCase()),
  'all',
  'use'
];

export const NOT_FOUND_MESSAGE = 'Not Found';
export const INTERNAL_ERROR_MESSAGE = 'Internal Server Error';
