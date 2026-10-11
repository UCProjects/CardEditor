/** @type {WeakMap<HTMLElement, import('./BaseRenderer.js').default>} */
const renderers = new WeakMap();

/** @param {import('./BaseRenderer.js').default} renderer */
export function track(renderer) {
  renderers.set(renderer.container, renderer);
}

/** @param {HTMLElement} container */
export function rendererOf(container) {
  return renderers.get(container);
}
