import { uuidValidateV4, uuidValidateV6 } from './3rdparty/uuid.js';
import { add as addImage } from './imageBank.js';
import { load as loadElement } from './elements/registry.js';
import './editor/editor.js';
import style from './style.css' with { type: 'css' };

document.adoptedStyleSheets.push(style);

// Groups on screen
// Initialize Image Base

class UndercardEditor {
  init() {
    // Load the page
  }

  newGroup() {}
}

// Async to prevent locking main
export async function loadStorage() {
  Object.entries(localStorage).forEach(([id, data]) => {
    if (uuidValidateV4(id)) {
      try {
        loadElement(id);
      } catch {
        // TODO toast error
      }
    } else if (uuidValidateV6(id)) {
      try {
        addImage({
          ...JSON.parse(data),
          id,
        });
      } catch {
        // TODO toast error
      }
    } // else if (uuidValidateV7(id)) {}
  });
}

export default new UndercardEditor();
