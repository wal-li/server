import request from 'supertest';

import { createRouter, createServer } from '../src';

describe('Route test', function () {
  let server;
  beforeAll(async () => {
    server = createServer();

    server.get(async () => ({ status: 200, body: 'Home Page' }));
    server.all('/about', async () => ({ status: 200, body: 'About me' }));

    const subRouter = createRouter();
    subRouter.use(async (input, next) => {
      input.prefix ||= '';
      input.prefix += '2';
      return await next();
    });
    subRouter.get('/ok', (input) => ({ body: input.prefix + ' ok' }));
    subRouter.post('/ok', (input) => ({ body: input.prefix + ' not ok' }));

    server.use(subRouter);
    server.use(
      '/sub-route',
      async (input, next) => {
        input.prefix = '1 ';
        return await next();
      },
      subRouter
    );

    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  function makeRequest() {
    return request(server.address);
  }

  it('should match get and auth path to home', async () => {
    const res = await makeRequest().get('/');

    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', 'Home Page');
  });

  it('should auto ending slash', async () => {
    const res = await makeRequest().get('/about/');

    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', 'About me');
  });

  it('should handle sub-route', async () => {
    const res = await makeRequest().get('/ok');
    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', '2 ok');

    const res2 = await makeRequest().get('/sub-route/ok');
    expect(res2).toHaveProperty('status', 200);
    expect(res2).toHaveProperty('text', '1 2 ok');

    const res3 = await makeRequest().post('/sub-route/ok');
    expect(res3).toHaveProperty('status', 200);
    expect(res3).toHaveProperty('text', '1 2 not ok');
  });
});
