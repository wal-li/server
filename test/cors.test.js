import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import { createServer } from '../src/index.js';

chai.use(chaiHttp);

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
    const res = await chai.request(server.address).get('/hello');
    expect(res).to.has.property('headers');
    expect(res.headers).to.has.property('access-control-allow-origin', '*');
    expect(res.headers).to.has.property('access-control-allow-methods', '*');
    expect(res.headers).to.has.property('access-control-allow-headers', '*');

    // test server
    const res2 = await chai.request(server.address).options('/hello');
    expect(res2).to.has.property('status', 204);
    expect(res2).to.has.property('headers');
    expect(res2.headers).to.has.property('access-control-allow-origin', '*');
    expect(res2.headers).to.has.property('access-control-allow-methods', '*');
    expect(res2.headers).to.has.property('access-control-allow-headers', '*');

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
    const res = await chai.request(server.address).get('/hello');
    expect(res).to.has.property('headers');
    expect(res.headers).not.to.has.property('access-control-allow-origin');

    const res2 = await chai.request(server.address).get('/hi');
    expect(res2).to.has.property('headers');
    expect(res2.headers).to.has.property('access-control-allow-origin', '*');
    expect(res2.headers).to.has.property('access-control-allow-methods', '*');
    expect(res2.headers).to.has.property('access-control-allow-headers', '*');

    const res3 = await chai.request(server.address).options('/hi');
    expect(res3).to.has.property('status', 204);
    expect(res3).to.has.property('headers');
    expect(res3.headers).to.has.property('access-control-allow-origin', '*');
    expect(res3.headers).to.has.property('access-control-allow-methods', '*');
    expect(res3.headers).to.has.property('access-control-allow-headers', '*');

    // stop server
    await server.stop();
    await server.stop();
  });
});
