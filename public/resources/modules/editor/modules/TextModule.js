import { getAll, ImageType } from '../../imageBank.js';
import Module from './ImageModule.js';

export default class TextModule extends Module {
  getImages() {
    const images = Object.entries(getAll(ImageType.Artifact));
    return [{
      label: 'Your Artifacts',
      items: images.map(([key]) => key),
    }];
  }
}
