export function object() {
  const obj = {};

  Object.defineProperties(obj, {
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

  return obj;
}
