/**
 * @param {HTMLElement} row
 * @param {string} query
 */
export function matches(row, query) {
  if (!query) return true;
  const haystack = row.dataset.search ?? row.querySelector(':scope > .wrapper .name')?.textContent ?? '';
  return haystack.toLowerCase().includes(query.toLowerCase());
}

/**
 * @param {HTMLInputElement} input
 * @param {(query: string) => void} apply
 */
export function bindFilter(input, apply) {
  function run() {
    apply(input.value.trim());
  }
  input.addEventListener('input', run);
  input.addEventListener('search', run);
  return run;
}
