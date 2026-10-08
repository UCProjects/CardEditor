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
 * @param {HTMLElement} root
 * @param {string} query
 */
export function filterRows(root, query) {
  root.classList.toggle('filtering', !!query);
  root.querySelectorAll(':scope > li[data-id]').forEach((row) => {
    const self = matches(row, query);
    let child = false;
    row.querySelectorAll(':scope > ul.extra > li[data-id]').forEach((nested) => {
      const show = self || matches(nested, query);
      nested.classList.toggle('filtered', !show);
      if (show && query) child = true;
    });
    row.classList.toggle('filtered', !!query && !self && !child);
  });
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
