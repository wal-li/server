import pino from 'pino';
import pretty from 'pino-pretty';
import colors from 'colors';
import { LOGGER_LEVELS } from './constants.js';

export const createLogger = (name) => {
  return pino(
    {
      customLevels: LOGGER_LEVELS,
      useOnlyCustomLevels: true,
      level: 'http'
    },
    pretty({
      colorize: true,
      ignore: 'pid,hostname',
      customPrettifiers: {
        name(name) {
          if (name[0] === '_') {
            // system service
            return colors.red(name.substring(1));
          }

          return name;
        }
      }
    })
  ).child({ name });
};

export async function logMiddleware(ctx, next) {
  ctx.logs = [];

  const ltime = new Date();
  await next();
  const ctime = new Date();

  const msgs = ctx.logs;

  msgs.push(colors.magenta(ctx.method));
  msgs.push(Math.floor(ctx.status / 100) === 2 ? colors.green(ctx.status) : colors.red(ctx.status));
  msgs.push(colors.white(ctx.url));

  const redirectLocation = ctx.response.header.location;
  if (redirectLocation) {
    msgs.push(colors.gray(`-> ${redirectLocation}`));
  }

  msgs.push(colors.yellow(`${ctime - ltime}ms`));

  this.logger.http(msgs.join(' '));
}
