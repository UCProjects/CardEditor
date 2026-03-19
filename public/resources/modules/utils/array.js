
export function allStrings(...data) {
  return data.every((value) => typeof value === 'string');
}

export function contains(a, b) {
  return a.some(i => b.includes(i));
}

/**
 * @param {Iterable} iterable
 * @param  {...any} ignore
 * @returns {Array}
 */
export function filter(iterable, ...ignore) {
  const array = Array.isArray(iterable) ? iterable : (
    // Iterables require transforming to arrays to filter
    isIterable(iterable) ? [...iterable] : []
  );
  return array.filter((i) => !ignore.includes(i));
}

export function getArray(value) {
  if (Array.isArray(value) && value.length) {
    return value;
  }
  return undefined;
}

export function isIterable(obj) {
  return obj && typeof obj[Symbol.iterator] === 'function';
}

export function match(array, other) {
  if (
    !Array.isArray(array) ||
    !Array.isArray(other) ||
    array.length !== other.length
  ) return false;

  return array.every((val, i) => val === other[i]);
}

export function sortedMatch(array, other) {
  if (
    !Array.isArray(array) ||
    !Array.isArray(other) ||
    array.length !== other.length
  ) return false;

  if (array === other) return true;

  const sortedA = [...array].sort();
  const sortedO = [...other].sort();

  return sortedA.every((val, i) => val === sortedO[i]);
}

/**
 * @param {Array<any>} array
 * @param {number} from
 * @param {number} to
 */
export function swap(array, from, to) {
  const [moved] = array.splice(from, 1);
  array.splice(to, 0, moved);
}
