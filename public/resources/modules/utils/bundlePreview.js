const DATA_URL = /^data:([^;,]*)/;

/** @param {import('../transfer.js').Bundle} bundle */
export function preview(bundle) {
  return JSON.stringify(bundle, (_, value) => {
    if (typeof value !== 'string') return value;
    const [, type] = value.match(DATA_URL) ?? [];
    return type === undefined ? value : `data:${type};(${value.length} characters)`;
  }, 2);
}

/** @param {number} bytes */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
