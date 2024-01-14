import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createServer } from '../src/index.js';

chai.use(chaiHttp);

describe('Route test', function () {
  let server;
  before(async () => {
    server = createServer();

    server.get(async () => ({ status: 200, body: 'Home Page' }));
    server.get('/about', async () => ({ status: 200, body: 'About me' }));

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
});
