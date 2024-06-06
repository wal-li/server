import request from 'supertest';

import { createServer } from '../src';

describe('Cors test', function () {
  let server;

  afterEach(async () => {
    await server.stop();
  });

  it('should cors server', async () => {
    // init server
    server = createServer({ port: 8080, cors: true });

    // start server
    await server.start();
    await server.start();

    // test server
    const res = await request(server.address).get('/hello');
    expect(res).toHaveProperty('headers');
    expect(res.headers).toHaveProperty('access-control-allow-origin', '*');
    expect(res.headers).toHaveProperty('access-control-allow-methods', '*');
    expect(res.headers).toHaveProperty('access-control-allow-headers', '*');

    // test server
    const res2 = await request(server.address).options('/hello');
    expect(res2).toHaveProperty('status', 204);
    expect(res2).toHaveProperty('headers');
    expect(res2.headers).toHaveProperty('access-control-allow-origin', '*');
    expect(res2.headers).toHaveProperty('access-control-allow-methods', '*');
    expect(res2.headers).toHaveProperty('access-control-allow-headers', '*');

    // stop server
    await server.stop();
    await server.stop();
  });

  it('should cors route', async () => {
    // init server
    server = createServer({ port: 8080 });

    server.get('/hi', () => ({ body: 'ok' }), { cors: true });

    // start server
    await server.start();
    await server.start();

    // test server
    const res = await request(server.address).get('/hello');
    expect(res).toHaveProperty('headers');
    expect(res.headers).not.toHaveProperty('access-control-allow-origin');

    const res2 = await request(server.address).get('/hi');
    expect(res2).toHaveProperty('headers');
    expect(res2.headers).toHaveProperty('access-control-allow-origin', '*');
    expect(res2.headers).toHaveProperty('access-control-allow-methods', '*');
    expect(res2.headers).toHaveProperty('access-control-allow-headers', '*');

    const res3 = await request(server.address).options('/hi');
    expect(res3).toHaveProperty('status', 204);
    expect(res3).toHaveProperty('headers');
    expect(res3.headers).toHaveProperty('access-control-allow-origin', '*');
    expect(res3.headers).toHaveProperty('access-control-allow-methods', '*');
    expect(res3.headers).toHaveProperty('access-control-allow-headers', '*');

    // stop server
    await server.stop();
    await server.stop();
  });
});
