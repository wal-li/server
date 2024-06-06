import request from 'supertest';

import { createServer, createOutput as out } from '../src';

const RANDOM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('Request test', function () {
  let server;
  beforeAll(async () => {
    server = createServer({ debug: true });

    server.get('/simple-get/:name', (input) => out(input));
    server.post('/submit-form', (input) => out(input));

    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should get path and method', async () => {
    const res = await request(server.address)
      .get('/simple-get/foo?your=name')
      .set('Custom-Header', 'Yes');

    expect(res.body).toHaveProperty('path', '/simple-get/foo');
    expect(res.body).toHaveProperty('method', 'GET');

    expect(res.body).toHaveProperty('params');
    expect(res.body.params).toHaveProperty('name', 'foo');

    expect(res.body).toHaveProperty('query');
    expect(res.body.query).toHaveProperty('your', 'name');

    expect(res.body).toHaveProperty('headers');
    expect(res.body.headers).toHaveProperty('custom-header', 'Yes');
  });

  it('should send a form', async () => {
    const res = await request(server.address)
      .post('/submit-form')
      .send('username=foo&password=123');

    expect(res.body).toHaveProperty('fields');
    expect(res.body.fields).toHaveProperty('username');
    expect(res.body.fields.username).toContain('foo');
    expect(res.body.fields).toHaveProperty('password');
    expect(res.body.fields.password).toContain('123');

    const res2 = await request(server.address)
      .post('/submit-form')
      .send({ username: 'foo', password: '123' });

    expect(res2.body).toHaveProperty('fields');
    expect(res2.body.fields).toHaveProperty('username', 'foo');
    expect(res2.body.fields).toHaveProperty('password', '123');
  });

  it('should send files', async () => {
    const res = await request(server.address)
      .post('/submit-form')
      .attach('upload', './package.json');

    expect(res.body).toHaveProperty('files');
    expect(res.body.files).toHaveProperty('upload');
    expect(res.body.files.upload[0]).toHaveProperty(
      'originalFilename',
      'package.json'
    );
  });
});
