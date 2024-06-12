import parseurl from 'parseurl';
import qs from 'qs';
import formidable from 'formidable';
import cookie from 'cookie';

export async function prepareInput(req: any) {
  const purl: any = parseurl(req);
  const querystring = purl.query || '';
  const form = formidable({});

  const [fields, files] = await form.parse(req);

  return {
    path: purl.pathname,
    method: req.method,
    headers: req.headers,
    cookies: cookie.parse(req.headers.cookie || ''),
    query: qs.parse(querystring),
    fields,
    files
  };
}
