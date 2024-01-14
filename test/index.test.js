import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import { createServer } from '../src/index.js';

chai.use(chaiHttp);

describe('Server test', function () {
  let server;

  afterEach(async () => {
    await server.stop();
  });

  it('should create a new server', async () => {
    // init server
    server = createServer({ port: 8080 });

    // start server
    await server.start();
    await server.start();

    // test server
    const res = await chai.request(server.address).get('/hello');
    expect(res).to.has.property('status', 404);
    expect(res).to.has.property('text', 'Not Found');

    // stop server
    await server.stop();
    await server.stop();
  });

  it('should not start server because of duplicate port', async () => {
    const server1 = createServer({ port: 8080 });
    const server2 = createServer({ port: 8080 });

    await server1.start();

    try {
      await server2.start();
      assert.fail('should error');
    } catch (err) {
      expect(err).to.has.property('code', 'EADDRINUSE');
    }

    await server1.stop();
  });

  it('should throw error because of invalid route', async () => {
    try {
      server.get(undefined);
      assert.fail('should error');
    } catch (err) {
      expect(err).to.has.property('message', "Invalid argument 'undefined'");
    }
  });

  it('should handle get and post request', async () => {
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
    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'ok');

    const res2 = await chai.request(server.address).post('/');
    expect(res2).to.has.property('status', 401);
    expect(res2).to.has.property('text', 'ok post');

    // stop server
    await server.stop();
  });

  it('should nested route', async () => {
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
    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'parent child');

    // stop server
    await server.stop();
  });

  it('should handle exception', async () => {
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
    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 500);
    expect(res).to.has.property('text', 'Something wrong');

    const res2 = await chai.request(server.address).get('/ok');
    expect(res2).to.has.property('status', 200);
    expect(res2).to.has.property('text', 'ok');

    chai.request(server.address).get('/never-end').then();

    await server.stop();
  });
});
