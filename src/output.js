export function sendOutput(res, output) {
  res.writeHead(output.status);
  res.end(output.body);
}
