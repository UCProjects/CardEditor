import loadResource from './utils/resource.js';
import { add, ImageType } from './imageBank.js';

export const effects = [];

const container = document.getElementById('effects');

export async function load() {
  const data = await loadResource('status');

  effects.push(...data);

  data.forEach((effect) => {
    const src = `/resources/images/effects/${effect}.png`;
    const img = document.createElement('img');
    img.src = src;
    img.classList.add('selectable', 'smallIcon');
    img.dataset.value = effect;
    img.draggable = false;
    container.append(img);
    add({
      id: effect,
      name: effect,
      src,
      type: ImageType.Effect,
    });
  });
}