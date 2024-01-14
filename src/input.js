import parseurl from 'parseurl';
import qs from 'qs';
import formidable from 'formidable';

export async function prepareInput(req) {
  const purl = parseurl(req);
  const querystring = purl.query || '';
  const form = formidable({});

  const [fields, files] = await form.parse(req);

  return {
    path: purl.pathname,
    method: req.method,
    headers: req.headers,
    query: qs.parse(querystring),
    fields,
    files
  };
}
