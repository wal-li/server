import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createOutput as out, createServer } from '../src/index.js';

chai.use(chaiHttp);

const RANDOM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('Request test', function () {
  let server;
  before(async () => {
    server = createServer({ debug: true });

    server.get('/simple-get/:name', (input) => out(input));
    server.post('/submit-form', (input) => out(input));

    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  function makeRequest() {
    return chai.request(server.address);
  }

  it('should get path and method', async () => {
    const res = await makeRequest()
      .get('/simple-get/foo?your=name')
      .set('Custom-Header', 'Yes');

    expect(res.body).to.has.property('path', '/simple-get/foo');
    expect(res.body).to.has.property('method', 'GET');

    expect(res.body).to.has.property('params');
    expect(res.body.params).to.has.property('name', 'foo');

    expect(res.body).to.has.property('query');
    expect(res.body.query).to.has.property('your', 'name');

    expect(res.body).to.has.property('headers');
    expect(res.body.headers).to.has.property('custom-header', 'Yes');
  });

  it('should send a form', async () => {
    const res = await makeRequest()
      .post('/submit-form')
      .send('username=foo&password=123');

    expect(res.body).to.has.property('fields');
    expect(res.body.fields).to.has.property('username');
    expect(res.body.fields.username).to.be.include('foo');
    expect(res.body.fields).to.has.property('password');
    expect(res.body.fields.password).to.be.include('123');

    const res2 = await makeRequest()
      .post('/submit-form')
      .send({ username: 'foo', password: '123' });

    expect(res2.body).to.has.property('fields');
    expect(res2.body.fields).to.has.property('username', 'foo');
    expect(res2.body.fields).to.has.property('password', '123');
  });

  it('should send files', async () => {
    const res = await makeRequest()
      .post('/submit-form')
      .attach('upload', './package.json');

    expect(res.body).to.has.property('files');
    expect(res.body.files).to.has.property('upload');
    expect(res.body.files.upload[0]).to.has.property(
      'originalFilename',
      'package.json'
    );
  });
});
