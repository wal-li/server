import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Router } from '../src/index.js';

chai.use(chaiHttp);

describe('Router test', function () {
  it('should create a router', async () => {
    const router = new Router();
    const botRouter = new Router();

    // without slash - should append begin
    botRouter.post('bot', () => ({
      status: 200,
      body: 'Hello, Bot!'
    }));

    // with end slash - should remove end, and append begin
    botRouter.post('/human/', () => ({
      status: 200,
      body: 'Hello, Human!'
    }));

    // normal case
    router.get('/greet', () => ({ status: 200, body: 'Hello, World!' }));

    // without begin slash
    router.get('greet', botRouter);

    // without begin slash, add end slash
    router.use('bonjour/', botRouter);

    expect(router.routes).to.has.property('length', 5);
    expect(router.routes[0]).to.has.property('path', '/greet');
    expect(router.routes[0].methods).to.has.members(['get']);

    expect(router.routes[1]).to.has.property('path', '/greet/bot');
    expect(router.routes[1].methods).to.has.members(['get', 'post']);

    expect(router.routes[2]).to.has.property('path', '/greet/human');
    expect(router.routes[2].methods).to.has.members(['get', 'post']);

    expect(router.routes[3]).to.has.property('path', '/bonjour/bot');
    expect(router.routes[3].methods).to.has.members(['post']);

    expect(router.routes[4]).to.has.property('path', '/bonjour/human');
    expect(router.routes[4].methods).to.has.members(['post']);
  });
});
