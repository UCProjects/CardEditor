import Module from '../Module.js';

export default class ImageModule extends Module {
  init() {
    super.init();

    const { container, instance, element, signal } = this;

    function update(value) {
      instance.update(value, 'image');
    }

    const select = container.querySelector('select[name="image"]');
    const blank = select.querySelector('[value=""]');
    const file = container.querySelector('fieldset[name="upload"]');
    const link = container.querySelector('fieldset[name="url"]');

    const isURL = element.image.startsWith('http');

    select.value = isURL ? 'url' : element.image || '';

    container.querySelectorAll('[data-editing="image"] .warn').forEach((el) => el.classList.add('hidden'));
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
        container.querySelector(`[data-editing="image"] input[name="${value}"]`).focus();
      } else {
        update(value);
      }
    }, { signal });

    {
      const input = link.querySelector('input');
      input.value = isURL ? element.image : '';
      if (isURL) input.focus();
      input.addEventListener('change', () => {
        link.querySelector('.warn').classList.add('hidden');
        if (input.matches(':valid')) update(input.value);
        else input.value = '';
      }, { signal });
    }

    file.querySelector('input').addEventListener('change', () => {
      // TODO How to handle temporary uploads?
    }, { signal });

    // On save, if new upload, save image to image bank and update element value...?
    // Or should I delete the upload on close and when value changed?

    // If error, reset input
    container.querySelector('.preview .image img').addEventListener('error', () => {
      if (!element.image) return;
      const el = select.value === 'url' ? link : file;
      el.querySelector('.warn').classList.remove('hidden');
      update('');
    }, { signal });

    this.on('click', (type) => {
      if (type !== 'image' || select.value !== 'url') return;
      link.querySelector('input').focus();
    });
  }
}
