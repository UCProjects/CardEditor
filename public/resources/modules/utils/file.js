/**
 * @param {string} data
 * @param {string} filename
 * @param {string} [type]
 */
export function download(data, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}

/**
 * @param {File} file
 * @returns {Promise<string | undefined>}
 */
export function read(file) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = (e) => {
      console.error(e);
      res();
    };
    reader.readAsDataURL(file);
  });
}
