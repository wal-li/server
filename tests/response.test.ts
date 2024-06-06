import request from 'supertest';

import { OutputFile, createOutput, createServer } from '../src';

const RANDOM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('Response test', function () {
  let server;
  beforeAll(async () => {
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
      createOutput({
        can: { be: ['json'], and: { unicode: 'Thời tiết hôm nay rất được' } }
      })
    );

    server.get('/cat-image', async () => ({
      body: new OutputFile('./tests/fixtures/cat.png')
    }));

    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  function makeRequest() {
    return request(server.address);
  }

  it('should full response object', async () => {
    const res = await makeRequest().get('/full-response-object');

    expect(res).toHaveProperty('status', 201);
    expect(res).toHaveProperty('text', RANDOM_TEXT);
    expect(res.headers).toHaveProperty('content-type', 'text/plain');
    expect(res.headers).toHaveProperty(
      'content-length',
      RANDOM_TEXT.length.toString()
    );
  });

  it('should short response object', async () => {
    const res = await makeRequest().get('/short-response-object');

    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', `<p>Good HTML</p>`);
    expect(res.headers).toHaveProperty('content-type', 'text/html');
    expect(res.headers).toHaveProperty('content-length', '16');
  });

  it('should short response object with json type', async () => {
    const res = await makeRequest().get('/short-response-json');

    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty('text', `{"can":{"be":["json"]}}`);
    expect(res.headers).toHaveProperty('content-type', 'application/json');
    expect(res.headers).toHaveProperty('content-length', '23');
    expect(res.body).toHaveProperty('can');
  });

  it('should response method', async () => {
    const res = await makeRequest().get('/response-method');

    expect(res).toHaveProperty('status', 200);
    expect(res).toHaveProperty(
      'text',
      `{"can":{"be":["json"],"and":{"unicode":"Thời tiết hôm nay rất được"}}}`
    );
    expect(res.headers).toHaveProperty('content-type', 'application/json');
    expect(res.headers).toHaveProperty('content-length', '81');
    expect(res.body).toHaveProperty('can');
  });

  it('should return a binary response', async () => {
    const res = await makeRequest().get('/cat-image').buffer();

    expect(res).toHaveProperty('status', 200);

    expect(res.headers).toHaveProperty('content-type', 'image/png');
    expect(res.headers).toHaveProperty('content-length', '51024');

    expect(
      res.body.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    ).toBe(true);
  });
});
