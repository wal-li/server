import { Router } from '../src';

describe('Router test', function () {
  test('should create a router', async () => {
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
    router.use(
      'bonjour/',
      // middleware
      async (input, next) => {
        return await next();
      },
      botRouter
    );

    expect(router.routes).toHaveProperty('length', 6);
    expect(router.routes[0]).toHaveProperty('path', '/greet');
    ['get'].forEach((k) => expect(router.routes[0].methods).toContain(k));

    expect(router.routes[1]).toHaveProperty('path', '/greet/bot');
    ['get', 'post'].forEach((k) =>
      expect(router.routes[1].methods).toContain(k)
    );

    expect(router.routes[2]).toHaveProperty('path', '/greet/human');
    ['get', 'post'].forEach((k) =>
      expect(router.routes[2].methods).toContain(k)
    );

    expect(router.routes[3]).toHaveProperty('path', '/bonjour');
    expect(router.routes[3].methods).toHaveProperty('length', 0);

    expect(router.routes[4]).toHaveProperty('path', '/bonjour/bot');
    expect(router.routes[4].methods).toContain('post');

    expect(router.routes[5]).toHaveProperty('path', '/bonjour/human');
    expect(router.routes[5].methods).toContain('post');
  });
});
