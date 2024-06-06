export function isHTML(str: string) {
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(str);
}
