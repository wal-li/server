When you build a complex application server, you need the way to split handlers into modules.

In this article, we will use `Server` class as `Router` class (because `Server` inherit from `Router`).

## Let's start.

Simple router can be create:

```js
import { Router } from '@wal-li/router';

const router = new Router();
```

And you can add a route by:

```js
router.get('/greet', () => ({ status: 200, body: 'Hello, World!' }));
```

Then, we need to add more router.

```js
const botRouter = new Router();

botRouter.post('/bot', () => ({ status: 200, body: 'Hello, Bot!' }));
```

Nested routing:

```js
router.get('/greet', botRouter);
```

So, how it works?

Incomming HTTP Request `GET /greet`, the response is `Hello, World!`. Because it is the first match.

Incomming HTTP Request `GET /greet/bot` and `POST /greet/bot`, the response is `Hello, Bot!`. Because when you add a child router is parameter, it will add the child method into check list. Incomming request just need to match one method (parent or children), and the path must be the concatnate of parent and children `/greet/bot`.

Specially, the slash at the end or the begin of paths don't matter. Because it will be convert to the same format `/path/to/something`.

If you want to pass parent method check, and just check the children methods, use `use`:

```js
router.use('/greet', botRouter);
```

## Use cases

**Normal Methods + Normal Router Methods**

```js
botRouter.post('/bot', ...);
router.get('/greet', botRouter);
```

Match:

- path: `/greet/bot`
- methods: one of `['get', 'post']`

**Normal Methods + Use Router Method**

```js
botRouter.use('/bot', ...);
router.get('/greet', botRouter);
```

Match:

- path: one of [`/greet/bot`, `/greet/bot/(.*)`]
- methods: `get`

**Use Method + Normal Router Methods**

```js
botRouter.post('/bot', ...);
router.use('/greet', botRouter);
```

Match:

- path: `/greet/bot`
- methods: `post`

**Use Method + Use Router Method**

```js
botRouter.use('/bot', ...);
router.use('/greet', botRouter);
```

Match:

- path: one of [`/greet/bot`, `/greet/bot/(.*)`]
- methods: any
