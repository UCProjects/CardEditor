import Module from '../module.js';

export default class CardModule extends Module {
  init() {
    super.init();

    // Bind edit events, name, description, image, soul, number,

    const { instance: editor , signal } = this;
    const { container } = editor;
    // TODO: simplify this
    container.querySelector('input[name="name"]').addEventListener('input', () => {
      // TODO
    }, { signal });

    container.querySelector('[data-tribe="none"]').classList.toggle('active', !this.element.tribes.length);
  }
}
