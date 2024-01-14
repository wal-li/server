import mime from 'mime';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { getProp, isHTML } from './utils.js';

export class OutputFile {
  constructor(path, skipError = false) {
    if (!skipError && !existsSync(path))
      throw new Error(`File is not existed at ${path}`);

    this.stats = statSync(path);
    this.path = path;

    if (!skipError && !this.stats.isFile())
      throw new Error(`${path} is not file`);
  }
}

export function sendOutput(res, output) {
  const headers = output.headers || {};
  let { body, status } = output;

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
    if (!getProp(headers, 'content-length')) {
      headers['content-length'] = body.stats.size;
    }

    if (!getProp(headers, 'content-type')) {
      headers['content-type'] = mime.getType(body.path);
    }
  } else if (typeof body === 'string') {
    if (!getProp(headers, 'content-type')) {
      headers['content-type'] = isHTML(body) ? 'text/html' : 'text/plain';
    }

    if (!getProp(headers, 'content-length')) {
      headers['content-length'] = body.length;
    }
  } else if (typeof body === 'object') {
    body = JSON.stringify(body);

    if (!getProp(headers, 'content-type')) {
      headers['content-type'] = 'application/json';
    }

    if (!getProp(headers, 'content-length')) {
      headers['content-length'] = body.length;
    }
  }

  // write
  res.writeHead(status, headers);

  if (body instanceof OutputFile) {
    createReadStream(body.path).pipe(res);
  } else {
    res.end(body);
  }

  return { body, status, headers };
}

export function createOutput(body, output = {}) {
  return {
    ...output,
    body
  };
}
