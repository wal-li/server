import caseless from 'caseless';
import mime from 'mime';
import cookie from 'cookie';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { isHTML } from './utils';
import { ServerResponse } from 'node:http';

export class OutputFile {
  stats: any;
  path: string;

  constructor(path: string, skipError = false) {
    if (!skipError && !existsSync(path))
      throw new Error(`File is not existed at ${path}`);

    this.stats = statSync(path);
    this.path = path;

    if (!skipError && !this.stats.isFile())
      throw new Error(`${path} is not file`);
  }
}

export function sendOutput(res: ServerResponse, output: any) {
  const headers: any = caseless(output.headers || {});
  let { body, status, cookies = {} } = output;

  if (!status && !body) {
    status = StatusCodes.NOT_FOUND;
    body = ReasonPhrases.NOT_FOUND;
  }

  if (body instanceof Error) {
    status = status || StatusCodes.INTERNAL_SERVER_ERROR;
    body = body.message || ReasonPhrases.INTERNAL_SERVER_ERROR;
  }

  if (!status && body) {
    status = StatusCodes.OK;
  }

  // body response
  if (body instanceof OutputFile) {
    !headers.has('content-type') &&
      // @ts-ignore
      headers.set('content-type', mime.getType(body.path));
    !headers.has('content-length') &&
      headers.set('content-length', body.stats.size);
  } else if (typeof body === 'string') {
    !headers.has('content-type') &&
      headers.set('content-type', isHTML(body) ? 'text/html' : 'text/plain');
    !headers.has('content-length') &&
      headers.set('content-length', Buffer.byteLength(body));
  } else if (typeof body === 'object') {
    body = JSON.stringify(body);

    !headers.has('content-type') &&
      headers.set('content-type', 'application/json');
    !headers.has('content-length') &&
      headers.set('content-length', Buffer.byteLength(body));
  }

  // write cookie
  const cookieKeys = Object.keys(cookies);
  if (cookieKeys.length) {
    res.setHeader(
      `Set-Cookie`,
      cookieKeys.map((key) => {
        const data = cookies[key];
        const value = (typeof data === 'string' ? data : data?.value) || '';
        const opts = (typeof data === 'string' ? {} : data) || {};

        delete opts.value;

        return cookie.serialize(key, String(value), opts);
      })
    );
  }

  // write status code and headers
  res.writeHead(status, headers.dict);

  if (body instanceof OutputFile) {
    createReadStream(body.path).pipe(res);
  } else {
    res.end(body);
  }

  return { body, status, headers };
}

export function createOutput(body: any, output = {}) {
  return {
    ...output,
    body
  };
}
