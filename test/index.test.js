import chai, { expect } from 'chai';
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

    // test server
    const res = await chai.request(server.address).get('/hello');
    expect(res).to.has.property('status', 404);
    expect(res).to.has.property('text', 'Not Found');

    // stop server
    await server.stop();
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

    // start server
    await server.start();

    // test server
    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 500);
    expect(res).to.has.property('text', 'Internal Server Error');

    await server.stop();
  });
});
