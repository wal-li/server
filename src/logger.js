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
          return name;
        }
      },
      messageFormat(log, messageKey) {
        switch (log.level) {
          case LOGGER_LEVELS.error:
            return colors.red(log[messageKey]);
          case LOGGER_LEVELS.info:
            return colors.green(log[messageKey]);
          default:
            return log[messageKey];
        }
      }
    })
  ).child({ name });
};
