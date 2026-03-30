import { uuidValidate, uuidValidateV4, uuidValidateV6 } from './3rdparty/uuid.js';
import { add as addImage } from './imageBank.js';
import { get as getElement, init, load as loadElement } from './elements/registry.js';
import './editor/editor.js';
import './tip/index.js';
import { load as loadArchive } from './archive/index.js';
import style from '../styles/index.css' with { type: 'css' };
import { toast, tryOrErrorSync } from './toast/index.js';
import { Elements } from './elements/types.js';
import setup, { sortGroup } from './draggable.js';
import { swap } from './utils/array.js';
import { adoptStyle } from './utils/funcs.js';

adoptStyle(style);

const app = document.getElementById('app');
const version = document.querySelector('template#version').innerHTML;

/** @typedef {import('./render/GroupRenderer.js').default} GroupRenderer */

class UndercardEditor {
  /** @type {Array<GroupRenderer>} */
  #groups = [];

  /** @type {Readonly<{ isOpen: boolean; }>} */
  #toast;

  constructor() {
    window.addEventListener('beforeunload', () => {
      this.save();
    });

    sortGroup.on('sortable:stop', (e) => {
      swap(this.#groups, e.oldIndex, e.newIndex);
    });
  }


  init() {
    this.versionToast();

    const groups = tryOrErrorSync(() => JSON.parse(localStorage.getItem('groups')));
    if (Array.isArray(groups)) {
      tryOrErrorSync(
        () => {
          const loaded = groups.map((id) => tryOrErrorSync(
            () => {
              const renderer = getElement(id).renderer();
              this.addGroup(renderer);
              return renderer;
            },
            `Error adding Group[${id}]`
          ));

          setTimeout(() => requestAnimationFrame(() => loaded.forEach((el) => el?.emit('loaded'))), 100);
        },
        'Error loading groups'
      );
    }

    if (!this.#groups.length) this.newGroup();

    loadArchive();
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
      if (!~index) return;
      this.#groups.splice(index, 1);
      renderer.emit('archived');
      if (!this.#groups.length) this.newGroup();
    });
    if (after) {
      this.#groups[after - 1].container.after(renderer.container);
      this.#groups.splice(after, 0, renderer);
    } else {
      app.append(renderer.container);
      this.#groups.push(renderer);
    }
    renderer.content();
    setup(renderer);
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
  for (let i = 0; i < localStorage.length; i++) {
    const id = localStorage.key(i);
    if (!uuidValidate(id)) continue;
    if (uuidValidateV4(id)) {
      tryOrErrorSync(
        () => loadElement(id),
        `Error loading Element[${id}]`,
      );
    } else if (uuidValidateV6(id)) {
      const data = localStorage.getItem(id);
      tryOrErrorSync(
        () => addImage({
          ...JSON.parse(data),
          id,
        }),
        `Error loading Image[${id}]`,
      );
    } // else if (uuidValidateV7(id)) {}
  }
}

export default new UndercardEditor();
