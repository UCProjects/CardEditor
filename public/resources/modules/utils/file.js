import compression from 'https://ga.jspm.io/npm:browser-image-compression@2.0.2/dist/browser-image-compression.mjs';

/**
 * @typedef {{
 *  maxSizeMB?: number;
 *  maxWidthOrHeight?: number;
 *  useWebWorker?: boolean;
 *  signal?: AbortSignal;
 * }} CompressOptions
 */

/**
 * @param {File} file
 * @returns {Promise<string | undefined>}
 */
export function read(file) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = () => res();
    reader.readAsDataURL(file);
  });
}

/**
 * @param {File} file
 * @param {CompressOptions} [options]
 * @returns {Promise<File | undefined>}
 */
export function compress(file, options) {
  return compression(file, {
    ...options,
    libURL: 'https://ga.jspm.io/npm:browser-image-compression@2.0.2/dist/browser-image-compression.mjs',
  }).catch((e) => {
    console.error(e);
    return undefined;
  });
}
