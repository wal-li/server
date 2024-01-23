export function isHTML(str) {
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(str);
}
