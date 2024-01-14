export function getProp(object, key) {
  const asLowercase = key.toLowerCase();
  return object[
    Object.keys(object).find((k) => k.toLowerCase() === asLowercase)
  ];
}

export function isHTML(str) {
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(str);
}
