import colors from 'colors';

function getLocalISOString(date) {
  const offset = date.getTimezoneOffset();
  const offsetAbs = Math.abs(offset);
  const isoString = new Date(date.getTime() - offset * 60 * 1000).toISOString();
  return `${isoString.slice(0, -1)}${offset > 0 ? '-' : '+'}${String(
    Math.floor(offsetAbs / 60)
  ).padStart(2, '0')}:${String(offsetAbs % 60).padStart(2, '0')}`;
}

export const createLogger = (name) => {
  const createLogFunction =
    (type) =>
    (...args) => {
      let logTypeColor;

      switch (type.toLowerCase()) {
        case 'error':
          logTypeColor = colors.red;
          break;
        case 'info':
          logTypeColor = colors.green;
          break;
        case 'http':
          logTypeColor = colors.gray;
          break;
        default:
          logTypeColor = colors.gray;
      }

      console.log(
        `[${getLocalISOString(new Date()).split('T')[1]}]`,
        logTypeColor(type.toUpperCase()),
        `(${name}):`,
        ...args.map((msg) => logTypeColor(msg))
      );
    };

  return {
    info: createLogFunction('info'),
    http: createLogFunction('http'),
    success: createLogFunction('success'),
    error: createLogFunction('error'),
    warn: createLogFunction('warn')
  };
};
