import request from 'supertest';
import assert from 'assert';

import { Server, createServer } from '../src';

describe('Server test', () => {
  let server;

  afterEach(async () => {
    await server.stop();
  });

  test('should create a server', async () => {
    server = new Server();
  });

  test('should create a new server', async () => {
    // init server
    server = createServer({ port: 8080 });

    // start server
    await server.start();
    await server.start();

    // test server
    const res = await request(server.address).get('/hello');
    expect(res).toHaveProperty('status', 404);
    expect(res).toHaveProperty('text', 'Not Found');

    // stop server
    await server.stop();
    await server.stop();
  });

  test('should not start server because of duplicate port', async () => {
    const server1 = createServer({ port: 8080 });
    const server2 = createServer({ port: 8080 });

    await server1.start();

    try {
      await server2.start();
      assert.fail('should error');
    } catch (err) {
      expect(err).toHaveProperty('code', 'EADDRINUSE');
    }

    await server1.stop();
  });

  test('should throw error because of invalid route', async () => {
    try {
      server.get(undefined);
      assert.fail('should error');
    } catch (err) {
      expect(err).toHaveProperty('message', "Invalid argument 'undefined'");
    }
  });

  test('should handle get and post request', async () => {
    // init server
    server = createServer({ port: 8080 });

    server.post('/', async () => {
      return {
        status: 401,
        body: 'ok post'
      };
    });

    server.get('/', async () => {
      return {
        status: 200,
        body: 'ok'
      };
    });

    // start server
    await server.start();

    // test server
    const res = await request(server.address).get('/');
    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', 'ok');

    const res2 = await request(server.address).post('/');
    expect(res2).toHaveProperty('status', 401);
    expect(res2).toHaveProperty('text', 'ok post');

    // stop server
    await server.stop();
  });

  test('should nested route', async () => {
    // init server
    server = createServer({ port: 8080 });
    server.get('/', async (_, next) => {
      const res = await next();

      return {
        status: 200,
        body: 'parent ' + res.body
      };
    });
    server.get('/', async () => {
      return {
        body: 'child'
      };
    });

    // start server
    await server.start();

    // test server
    const res = await request(server.address).get('/');
    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', 'parent child');

    // stop server
    await server.stop();
  });

  test('should handle exception', async () => {
    // init server
    server = createServer({ port: 8080 });
    server.get('/', async () => {
      throw Error('Something wrong');
    });
    server.get('/ok', () => ({ status: 200, body: 'ok' }));
    server.get('/never-end', () => new Promise(() => {}));

    // start server
    await server.start();

    // test server
    const res = await request(server.address).get('/');
    expect(res).toHaveProperty('status', 500);
    expect(res).toHaveProperty('text', 'Something wrong');

    const res2 = await request(server.address).get('/ok');
    expect(res2).toHaveProperty('status', 200);
    expect(res2).toHaveProperty('text', 'ok');

    // request(server.address).get('/never-end').then();

    await server.stop();
  });
});
