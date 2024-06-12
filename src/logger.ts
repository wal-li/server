import colors from 'colors/safe';

function getLocalISOString(date: Date) {
  const offset = date.getTimezoneOffset();
  const offsetAbs = Math.abs(offset);
  const isoString = new Date(date.getTime() - offset * 60 * 1000).toISOString();
  return `${isoString.slice(0, -1)}${offset > 0 ? '-' : '+'}${String(
    Math.floor(offsetAbs / 60)
  ).padStart(2, '0')}:${String(offsetAbs % 60).padStart(2, '0')}`;
}

export function createLogger(name: string) {
  const createLogFunction =
    (type: string) =>
    (...args: any) => {
      let logTypeColor;

      switch (type.toLowerCase()) {
        case 'error':
          logTypeColor = colors.red;
          break;
        case 'success':
          logTypeColor = colors.green;
          break;
        default:
          logTypeColor = colors.gray;
      }

      console.log(
        `[${getLocalISOString(new Date()).split('T')[1]}]`,
        logTypeColor(type.toUpperCase()),
        `(${name}):`,
        ...args.map((msg: any) => logTypeColor(msg))
      );
    };

  return {
    info: createLogFunction('info'),
    http: createLogFunction('http'),
    success: createLogFunction('success'),
    error: createLogFunction('error'),
    warn: createLogFunction('warn')
  };
}
