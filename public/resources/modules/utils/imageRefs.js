import { asArray } from './array.js';

export function imageRefs({ effects = [], image, rarity, tribes = [] }) {
  return [image, rarity, ...tribes, ...effects.map((entry) => asArray(entry)[0])];
}
