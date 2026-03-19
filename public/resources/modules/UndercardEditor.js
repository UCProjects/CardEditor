import { uuidValidate, uuidValidateV4, uuidValidateV6 } from './3rdparty/uuid.js';
import { add as addImage } from './imageBank.js';
import { get as getElement, init, load as loadElement } from './elements/registry.js';
import './editor/editor.js';
import './tip/index.js';
import style from '../styles/index.css' with { type: 'css' };
import { toast, tryOrErrorSync } from './toast/index.js';
import { Elements } from './elements/types.js';

document.adoptedStyleSheets.push(style);

const app = document.getElementById('app');
const version = document.querySelector('template#version').innerHTML;

/** @typedef {import('./render/GroupRenderer.js').default} GroupRenderer */

class UndercardEditor {
  /** @type {Array<GroupRenderer>} */
  #groups = [];

  /** @type {Readonly<{isOpen: boolean }>} */
  #toast;

  constructor() {
    window.addEventListener('beforeunload', () => {
      this.save();
    });
  }


  init() {
    this.versionToast();

    const groups = tryOrErrorSync(() => JSON.parse(localStorage.getItem('groups')));
    if (Array.isArray(groups)) {
      tryOrErrorSync(
        () => {
          const loaded = groups.map((id) => tryOrErrorSync(
            // FIXME if load errors, group is lost to the void.
            () => {
              const renderer = getElement(id).renderer();
              this.addGroup(renderer);
              return renderer;

            },
            `Error adding Group[${id}]`
          ));

          function updateElements() {
            requestAnimationFrame(() => loaded.forEach((el) => el?.emit('loaded')));
          }
          if (typeof window.requestIdleCallback === 'function') {
            requestIdleCallback(updateElements);
          } else {
            setTimeout(updateElements, 100);
          }
        },
        'Error loading groups'
      );
    }

    if (!this.#groups.length) this.newGroup();
  }

  newGroup(index) {
    const group = init({ type: Elements.Group });
    this.addGroup(group.renderer(), index);
  }

  /** @param {GroupRenderer} renderer  */
  addGroup(renderer, after = 0) {
    renderer.on(Elements.Group, () => this.newGroup(this.#groups.indexOf(renderer) + 1));
    renderer.on('archive', () => {
      const index = this.#groups.indexOf(renderer);
      if (!~index || this.#groups.length === 1) return;
      renderer.emit('archived');
    });
    if (after) {
      this.#groups[after - 1].container.after(renderer.container);
      this.#groups.splice(after, 0, renderer);
    } else {
      app.append(renderer.container);
      this.#groups.push(renderer);
    }
    renderer.content();
    // renderer.one('save', () => this.save());
  }

  save() {
    const groups = this.#groups
      .filter(({ element: { id } }) => getElement(id)) // Only save groups that are registered
      .map(({ element: { id } }) => id); // Convert to IDs
    localStorage.setItem('groups', JSON.stringify(groups));
  }

  versionToast(force = false) {
    if (this.#toast?.isOpen || (
      !force && localStorage.getItem('version') === version
    )) return;
    this.#toast = toast({
      title: `Editor v${version}`,
      body: document.querySelector('#versionText').innerHTML,
    }).on('close', () => {
      localStorage.setItem('version', version);
    });
  }
}

// Async to prevent locking main
export async function loadStorage() {
  Object.entries(localStorage).forEach(([id, data]) => {
    if (!uuidValidate(id)) return;
    if (uuidValidateV4(id)) {
      tryOrErrorSync(
        () => loadElement(id),
        `Error loading Element[${id}]`,
      );
    } else if (uuidValidateV6(id)) {
      tryOrErrorSync(
        () => addImage({
          ...JSON.parse(data),
          id,
        }),
        `Error loading Image[${id}]`,
      );
    } // else if (uuidValidateV7(id)) {}
  });
}

export default new UndercardEditor();
