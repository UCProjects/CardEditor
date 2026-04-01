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
import settings from './settings.js';
import { getGroups, getVersion, setGroups, setVersion, getKeys } from './utils/storage.js';
import { getAll as getAllImages } from './utils/imageDB.js';
import { add as addImage } from './imageBank.js';

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
      settings.save();
    });

    sortGroup.on('sortable:stop', (e) => {
      if (e.oldIndex === e.newIndex) return;
      swap(this.#groups, e.oldIndex, e.newIndex);
    });
  }


  init() {
    settings.load();
    this.versionToast();

    const loaded = getGroups().map((id) => tryOrErrorSync(
      () => {
        const renderer = getElement(id).renderer();
        this.addGroup(renderer);
        return renderer;
      },
      `Error adding Group[${id}]`
    ));

    setTimeout(() => requestAnimationFrame(() => loaded.forEach((el) => el?.emit('loaded'))), 100);

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
    setGroups(groups);
  }

  versionToast(force = false) {
    if (this.#toast?.isOpen || (
      !force && getVersion() === version
    )) return;
    this.#toast = toast({
      title: `Editor v${version}`,
      body: document.querySelector('#versionText').innerHTML,
    }).on('close', () => setVersion(version));
  }
}

// Async to prevent locking main
export async function loadStorage() {
  for (const key of getKeys()) {
    const [, prefix, id] = key.split(':');
    if (prefix === 'el') {
      tryOrErrorSync(
        () => loadElement(id),
        `Error loading Element[${id}]`,
      );
    }
  }
  const images = await getAllImages();
  images.forEach(({ src, ...image }) => {
    tryOrErrorSync(() => {
      addImage(image);
    }, `Error loading Image[${image.id}]`);
  });
}

export default new UndercardEditor();
