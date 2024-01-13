export function prepareInput(req) {
  return { path: req.url, method: req.method };
}
