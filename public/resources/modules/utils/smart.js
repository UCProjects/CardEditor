export function object() {
  const ret = {};

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
    size: {
      get() {
        return Object.keys(this).length;
      },
    },
  });

  return ret;
}
