import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { getProp, isHTML } from './utils.js';

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

  if (typeof body === 'string') {
    if (!getProp(headers, 'content-type')) {
      headers['content-type'] = isHTML(body) ? 'text/html' : 'text/plain';
    }

    if (!getProp(headers, 'content-length')) {
      headers['content-length'] = body.length;
    }
  }

  if (typeof body === 'object') {
    body = JSON.stringify(body);

    if (!getProp(headers, 'content-type')) {
      headers['content-type'] = 'application/json';
    }

    if (!getProp(headers, 'content-length')) {
      headers['content-length'] = body.length;
    }
  }

  res.writeHead(status, headers);
  res.end(body);

  return { body, status, headers };
}

export function createOutput(body, output = {}) {
  return {
    ...output,
    body
  };
}
