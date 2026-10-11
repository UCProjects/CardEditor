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
