# Walli Server

## Usage

```js
import { createServer } from '@wal-li/server';

const server = createServer(config);

// routing logic

await server.start();

// other logic

await server.stop();
```

## Config

- `port`: (default: `8080`)
- `host`: (default: `127.0.0.1`)
- `name`: (default: `server`)
- `debug`: (default: `false`)
- `cors`: (default: `false`)

## Features

### Routing

Single path-handler.

```js
server.get(
  '/:some/:path',
  async (input) => {
    return output;
  },
  {
    some: 'config'
  }
);
```

Multiple path-handlers;

```js
server.post(
  '/path/a',
  '/path/b',
  async () => {
    /* handler a */
  },
  async () => {
    /* handler b */
  },
  {
    some: 'config'
  },
  {
    some: 'config'
  }
);
```

If no path defined, it will use `/`.

For config information, see **Config** section above.

### Methods

Using all `http.METHODS` with lowercase form, but method in `input` still be uppercase form.

Additions:

- `all`: match all method
- `use`: module

### Input

```json
{
  "path": "/request/path",
  "method": "GET"
}
```

### Output

Output has many forms, use what you like.

**Full Response Object**

This is original method.

```js
return {
  status: 200,
  body: 'response text',
  headers: { 'Content-Type': 'text/plain' }
};
```

**Short Response Object**

Some of response properties will be default/auto detect.

```js
return {};
```

Condition cases:

- `status` will be `200` if `body` available
- `status` will be `404` if body is `false` (included `undefined`, `null`,...), then body will be `Not Found`.
- `status` will be `500` if body is `Error`, then body will be `err.message` or `Internal Server Error`.

**None Response Object**

It will handle response like object that only have `body` property.

**Response Method**

```js
import { createOutput } from '@wal-li/server';

return createOutput({ can: { be: 'json' } }, { status: 200 });
```

- The first argument is `body`, this can be optional.
- The second is a response object without `body`, this can be optional.

### Module

```js
import { createRouter } from '@wal-li/server';

const router = createRouter();

// routing

server.use('/base', router);
```

When using `use`, it will be **inherited** method list from the child, when using other methods, it will be **merged** with the method list of the child.

### CORS

```js
server.use('/base', router, { cors: {} });
router.get('/route', handler, { cors: {} });
```

```

## Licenses

MIT.
```
