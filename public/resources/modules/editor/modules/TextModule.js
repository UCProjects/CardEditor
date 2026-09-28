import { getAll, ImageType } from '../../imageBank.js';
import Module from './ImageModule.js';

export default class TextModule extends Module {
  init() {
    super.init();

    const { container, element, instance, signal } = this;
    const selector = (rarity = '') => `fieldset.rarity .selectable[data-rarity="${rarity}"]`;

    function setActive(el) {
      if (!el) return;
      container.querySelector('fieldset.rarity .selectable.active')?.classList.remove('active');
      el.classList.add('active');
    }

    setActive(container.querySelector(selector(element.rarity)));

    container.querySelectorAll('fieldset.rarity .selectable').forEach((el) => {
      el.addEventListener('click', () => {
        setActive(el);
        instance.update(el.dataset.rarity, 'rarity');
      }, { signal });
    });
  }

  getImages() {
    const images = Object.entries(getAll(ImageType.Artifact));
    return [{
      label: 'Your Artifacts',
      items: images.map(([key]) => key),
    }];
  }
}
