/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function object(obj = {}) {
  const ret = { ...obj };
  Object.defineProperties(ret, {
    entries: {
      get() {
        return () => [...Object.entries(this)];
      },
    },
    has: {
      get() {
        return (key) => Object.hasOwn(this, key);
      },
    },
    hasValue: {
      get() {
        return (value) => Object.values(this).includes(value);
      },
    },
    size: {
      get() {
        return Object.keys(this).length;
      },
    },
  });

  return Object.isFrozen(obj) ? Object.freeze(obj) : ret;
}
