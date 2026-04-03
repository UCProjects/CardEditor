import { Elements } from '../../elements/types.js';
import { add, hasFile, getURL, ImageType, save } from '../../imageBank.js';
import Module from '../Module.js';

export default class ImageModule extends Module {
  init() {
    super.init();

    const { container, instance, element, signal } = this;

    function update(value) {
      instance.update(value, 'image');
    }

    // TODO load images from bank
    const select = container.querySelector('select[name="image"]');
    const blank = select.querySelector('[value=""]');
    const file = container.querySelector('fieldset[name="upload"]');
    const link = container.querySelector('fieldset[name="url"]');

    const isBlob = getURL(element.image).startsWith('blob:');
    const isURL = element.image.startsWith('http') || isBlob;

    select.value = isURL ? 'url' : element.image || '';

    container.querySelectorAll('[data-editing="image"] .warn').forEach((el) => el.classList.add('hidden'));
    file.classList.add('hidden');
    link.classList.toggle('hidden', !isURL);
    blank.classList.toggle('hidden', select.value !== '');

    select.addEventListener('change', () => {
      blank.classList.add('hidden');

      const { value } = select;
      const isFile = value === 'upload';
      const isLink = value === 'url';

      file.classList.toggle('hidden', !isFile);
      link.classList.toggle('hidden', !isLink);

      if (isFile || isLink) {
        const input = container.querySelector(`[data-editing="image"] input[name="${value}"]`);
        input.focus();
        if (isLink) update(input.value);
        else input.value = '';
      } else {
        update(value);
      }
    }, { signal });

    {
      const input = link.querySelector('input');
      input.value = isURL ? getURL(element.image) : '';
      if (isURL) input.focus();
      input.addEventListener('change', () => {
        link.querySelector('.warn').classList.add('hidden');
        if (input.matches(':valid')) update(input.value);
        else input.value = '';
      }, { signal });
    }

    // If error, reset input
    container.querySelector('.preview .image img').addEventListener('error', () => {
      if (!element.image) return;
      const el = select.value === 'url' ? link : file;
      el.querySelector('.warn').classList.remove('hidden');
      update('');
    }, { signal });

    // File handling
    {
      const input = file.querySelector('input');
      const warn = file.querySelector('.warn').classList;
      let pendingFile = false;
      input.addEventListener('change', async () => {
        warn.add('hidden');
        const [upload] = input.files;
        if (!upload) return;
        const id = add({
          file: upload,
          type: element.type === Elements.Card ? ImageType.Avatar : ImageType.Artifact,
        });
        link.querySelector('input').value = getURL(id);
        update(id);
        pendingFile = upload;
      }, { signal });
      instance.on('save', () => {
        if (!pendingFile) return;
        const id = element.image;
        if (!hasFile(id, pendingFile)) return;
        save(id);
      }, { signal });
    }

    this.on('click', (type) => {
      if (type !== 'image' || select.value !== 'url') return;
      link.querySelector('input').focus();
    });
  }
}
