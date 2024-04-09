In this article, we will use `Server` class as `Router` class (because `Server` inherit from `Router`).

Middleware:

You can use `use` with handler function for middleware.

```js
router.use('/abc', async (input, next) => {
  return await next();
});
```

All incoming request with any methods and paths `/abc`, `/abc/(.*)` will pass over this handler function.
