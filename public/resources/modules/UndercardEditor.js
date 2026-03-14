import { uuidValidate, uuidValidateV4, uuidValidateV6 } from './3rdparty/uuid.js';
import { add as addImage } from './imageBank.js';
import { get as getElement, init, load as loadElement, save, register } from './elements/registry.js';
import './editor/editor.js';
import style from '../styles/index.css' with { type: 'css' };
import { getArray } from './utils/array.js';
import { tryOrError } from './toast/index.js';
import { Elements } from './elements/types.js';

document.adoptedStyleSheets.push(style);

const app = document.getElementById('app');

class UndercardEditor {
  /** @type {Array<import('./render/group.js').default>} */
  #groups = [];

  constructor() {
    window.addEventListener('beforeunload', () => {
      this.save();
    });
  }


  init() {
    const groups = localStorage.getItem('groups');
    if (groups) {
      tryOrError(
        () => {
          const array = getArray(JSON.parse(groups)) || [];
          array.forEach((id) => {
            tryOrError(
              () => this.addGroup(getElement(id).renderer()),
              `Error adding Group[${id}]`
            );
          });
        },
        'Error loading groups'
      );
    }

    if (!this.#groups.length) this.newGroup();
  }

  newGroup() {
    const group = init({ type: Elements.Group });
    // TODO register on save?
    register(group);
    this.addGroup(group.renderer());
    // Save immediately?
    this.save();
  }

  /** @param {import('./render/group.js').default} renderer  */
  addGroup(renderer) {
    renderer.on(Elements.Group, () => this.newGroup());
    renderer.one('delete', () => {
      const index = this.#groups.indexOf(renderer);
      if (!~index) return;
      this.#groups.splice(index, 1);
    });
    // TODO on delete, remove from groups
    app.append(renderer.content());
    this.#groups.push(renderer);
    // TODO save when modified, rather than here
    save(renderer.element.id);
  }

  save() {
    const groups = this.#groups
      .filter(({ element: { id } }) => getElement(id)) // Only save groups that are registered
      .map(({ element: { id } }) => id); // Convert to IDs
    localStorage.setItem('groups', JSON.stringify(groups));
  }
}

// Async to prevent locking main
export async function loadStorage() {
  Object.entries(localStorage).forEach(([id, data]) => {
    if (!uuidValidate(id)) return;
    if (uuidValidateV4(id)) {
      tryOrError(
        () => loadElement(id),
        `Error loading Element[${id}]`,
      );
    } else if (uuidValidateV6(id)) {
      tryOrError(
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
