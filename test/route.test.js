import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createRouter, createServer } from '../src/index.js';

chai.use(chaiHttp);

describe('Route test', function () {
  let server;
  before(async () => {
    server = createServer();

    server.get(async () => ({ status: 200, body: 'Home Page' }));
    server.all('/about', async () => ({ status: 200, body: 'About me' }));

    const subRouter = createRouter();
    subRouter.get('/ok', () => ({ body: 'ok' }));

    server.use(subRouter);
    server.use('/sub-route', subRouter);

    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  function makeRequest() {
    return chai.request(server.address);
  }

  it('should match get and auth path to home', async () => {
    const res = await makeRequest().get('/');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'Home Page');
  });

  it('should auto ending slash', async () => {
    const res = await makeRequest().get('/about/');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'About me');
  });

  it('should handle sub-route', async () => {
    const res = await makeRequest().get('/ok');
    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', 'ok');

    const res2 = await makeRequest().get('/sub-route/ok');
    expect(res2).to.has.property('status', 200);
    expect(res2).to.has.property('text', 'ok');
  });
});
