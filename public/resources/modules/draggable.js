import { Draggable, Sortable } from 'https://ga.jspm.io/npm:@shopify/draggable@1.2.1/build/esm/index.mjs';
import { get, register, save } from './elements/registry.js';
import { swap } from './utils/array.js';

/** @typedef {import('./elements/GroupElement.js').default} GroupElement */

const exclude = {
  plugins: [Draggable.Plugins.Focusable, Draggable.Plugins.Announcement],
};

export const sortGroup = new Sortable([document.getElementById('app')], {
  draggable: '.element.group',
  handle: '.element.group .handle',
  classes: {
    'body:dragging': 'group-dragging',
    'source:dragging': 'dragging',
  },
  mirror: {
    constrainDimensions: true,
  },
  exclude,
});

const sortElement = new Sortable([], {
  draggable: '.element',
  handle: '.handlee',
  classes: {
    'source:dragging': 'dragging',
  },
  exclude,
}).on('sortable:stop', (e) => {
  /** @type {GroupElement} */
  const from = get(e.oldContainer.closest('[data-id]').dataset.id);

  if (e.oldContainer === e.newContainer) {
    swap(from.content, e.oldIndex, e.newIndex);
  } else {
    /** @type {GroupElement} */
    const to = get(e.newContainer.closest('[data-id]').dataset.id);
    const [moved] = from.content.splice(e.oldIndex, 1);
    to.content.splice(e.newIndex, 0, moved);
    save(to.id);
  }

  save(from.id);
});

/** @param {import('./render/GroupRenderer.js').default} group */
export default function setup({ container, element }) {
  sortElement.addContainer(container.querySelector('.content'));
  sortElement.on('sortable:sorted', () => {
    if (get(element.id)) return;
    register(element);
  });
}

export function isDragging() {
  return sortElement.isDragging() || sortGroup.isDragging();
}
