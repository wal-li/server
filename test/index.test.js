import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createServer } from '../src/index.js';

chai.use(chaiHttp);

describe('Server test', function () {
  it('should create a new server', async () => {
    const server = createServer({ port: 8080 });

    await server.start();

    const res = await chai.request(server.address).get('/hello');
    expect(res).to.has.property('status', 404);

    await server.stop();
  });

  it('should handle get request', async () => {
    const server = createServer({ port: 8080 });
    server.get('/', async (input) => {
      return {
        status: 200,
        body: 'ok'
      };
    });
    await server.start();

    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'ok');

    await server.stop();
  });

  it('should nested route', async () => {
    const server = createServer({ port: 8080 });
    server.get('/', async (input, next) => {
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
    await server.start();

    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'parent child');

    await server.stop();
  });

  it('should handle exception', async () => {
    const server = createServer({ port: 8080 });
    server.get('/', async (input) => {
      throw Error('Something wrong');
    });
    await server.start();

    const res = await chai.request(server.address).get('/');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'ok');

    await server.stop();
  });
});
