import { createLogger } from '../src';

describe('Logger test', () => {
  test('create loggers', async () => {
    const logger = createLogger('test');

    logger.error('error');
    logger.success('success');
    logger.info('info');
    logger.http('http');
    logger.warn('warn');
  });
});
