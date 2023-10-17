import chai, { expect } from 'chai';
import { Server } from '../src/index.js';
import chaiHttp from 'chai-http';
import {} from 'socket.io';

chai.use(chaiHttp);

describe('Server test', function () {
  it('should create a new server', async () => {
    const server = new Server(8080);

    server.router.get('/hi', async (ctx) => {
      ctx.body = 'hello';
    });

    await server.start();

    // server
    const res = await chai.request('http://localhost:8080').get('/hi');

    expect(res).to.has.property('text', 'hello');
    expect(res).to.has.property('status', 200);

    // socket.io
    const res2 = await chai.request('http://localhost:8080').get('/socket.io/socket.io.js');

    expect(res2.body.toString().indexOf('Socket.IO')).to.not.eq(-1);
    expect(res2).to.has.property('status', 200);

    await server.stop();
  });
});
