import { getAll, ImageType } from '../../imageBank.js';
import { isHashHex } from '../../utils/color.js';
import { Rarities } from '../../elements/types.js';
import customColor from './customColor.js';
import Module from './ImageModule.js';

export default class TextModule extends Module {
  init() {
    super.init();

    const { container, element, instance, signal } = this;
    const rarities = container.querySelector('fieldset.rarity');
    const presetRarity = (rarity) => rarities.querySelector(`.selectable[data-rarity="${Rarities.includes(rarity) ? rarity : ''}"]`);

    function setActive(el) {
      if (!el) return;
      rarities.querySelector('.selectable.active')?.classList.remove('active');
      el.classList.add('active');
    }

    const rarity = customColor({
      root: rarities,
      name: 'rarity',
      presets: Rarities,
      value: element.rarity,
      activate: (value) => setActive(isHashHex(value) ? rarity.element : presetRarity(value)),
      update: (value) => instance.update(value, 'rarity'),
    });

    setActive(rarity?.isCustom ? rarity.element : presetRarity(element.rarity));

    rarities.querySelectorAll('.selectable').forEach((el) => {
      el.addEventListener('click', () => {
        if (el === rarity?.element) {
          rarity.open(element.rarity);
          return;
        }
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
