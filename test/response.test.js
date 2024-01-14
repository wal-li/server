import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createOutput, createServer } from '../src/index.js';

chai.use(chaiHttp);

const RANDOM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('Response test', function () {
  let server;
  before(async () => {
    server = createServer();

    server.get('/full-response-object', async () => ({
      status: 201,
      body: RANDOM_TEXT,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': RANDOM_TEXT.length
      }
    }));

    server.get('/short-response-object', async () => ({
      body: '<p>Good HTML</p>'
    }));

    server.get('/short-response-json', async () => ({
      body: { can: { be: ['json'] } }
    }));

    server.get('/response-method', async () =>
      createOutput({ can: { be: ['json'] } })
    );

    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  function makeRequest() {
    return chai.request(server.address);
  }

  it('should full response object', async () => {
    const res = await makeRequest().get('/full-response-object');

    expect(res).to.has.property('status', 201);
    expect(res).to.has.property('text', RANDOM_TEXT);
    expect(res.headers).to.has.property('content-type', 'text/plain');
    expect(res.headers).to.has.property(
      'content-length',
      RANDOM_TEXT.length.toString()
    );
  });

  it('should short response object', async () => {
    const res = await makeRequest().get('/short-response-object');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', `<p>Good HTML</p>`);
    expect(res.headers).to.has.property('content-type', 'text/html');
    expect(res.headers).to.has.property('content-length', '16');
  });

  it('should short response object with json type', async () => {
    const res = await makeRequest().get('/short-response-json');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', `{"can":{"be":["json"]}}`);
    expect(res.headers).to.has.property('content-type', 'application/json');
    expect(res.headers).to.has.property('content-length', '23');
    expect(res.body).to.has.property('can');
  });

  it('should response method', async () => {
    const res = await makeRequest().get('/response-method');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text', `{"can":{"be":["json"]}}`);
    expect(res.headers).to.has.property('content-type', 'application/json');
    expect(res.headers).to.has.property('content-length', '23');
    expect(res.body).to.has.property('can');
  });
});
