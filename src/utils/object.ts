
export const isPlainObject = (obj: unknown) => {
  return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Creates key:value representation of the given nested object. Where "key" is lodash like object path.
 * Example input:
 * const obj = {
 *   a: { b: { c: 1 } },
 *   v: [[ 1 ]],
 *   d: [{ x: 6, s: [1, { z: { c: { b: 'hello' } } }] }]
 * }
 * Example output:
 * {
 *   'a.b.c': 1,
 *   'v[0][0]': 1,
 *   'd[0].x': 6,
 *   'd[0].s[0]': 1,
 *   'd[0].s[1].z.c.b': 'hello'
 * }
 */
export const flat = (obj: unknown): Record<string, any> => {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return {};
  }
  const result = {};

  const walk = (obj, path = '') => {
    if (isPlainObject(obj)) {
      return Object.keys(obj).forEach(key => {
        walk(obj[key], path.length ? `${path}.${key}` : key);
      });
    }
    if (Array.isArray(obj)) {
      return obj.forEach((obj, i) => {
        walk(obj, `${path}[${i}]`);
      });
    }

    result[path] = obj;
  };
  walk(obj, '');
  return result;
};

// "typesafe" Object.entries
export const entries = <T, K extends keyof T = keyof T>(obj: T): [K, NonNullable<T[K]>][] => {
  return Object.entries(obj).filter(([, v]) => !!v) as unknown as [K, NonNullable<T[K]>][];
};
// "typesafe" Object.values
export const values = <T, K extends keyof T = keyof T>(obj: T): NonNullable<T[K]>[] => {
  return Object.values(obj).filter(v => !!v);
};
// "typesafe" Object.keys
export const keys = <T, K extends keyof T = keyof T>(obj: T): K[] => Object.keys(obj) as unknown as K[];
