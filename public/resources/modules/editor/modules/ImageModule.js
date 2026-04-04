import { Elements } from '../../elements/types.js';
import { add, hasFile, getURL, ImageType, save, getName } from '../../imageBank.js';
import Select from '../../select/index.js';
import Module from '../Module.js';

function img(src) {
  const ret = document.createElement('img');
  ret.src = src;
  return ret;
}

function span(text) {
  const ret = document.createElement('span');
  ret.textContent = text;
  return ret;
}

export default class ImageModule extends Module {
  static #select = new Select(document.querySelector('#editor [data-editing="image"] [data-select]'), {
    renderer(opt, label) {
      if (['url', 'upload'].includes(opt)) {
        return span(label);
      }
      const div = document.createElement('div');
      const url = getURL(opt);
      if (url) div.append(img(url));
      div.append(span(label));
      return div;
    },
    getLabel(opt) {
      if (opt === 'url') return 'Link';
      if (opt === 'upload') return 'New File';
      return getName(opt) || opt;
    }
  });

  init() {
    super.init();

    const { container, instance, element, signal } = this;
    const select = ImageModule.#select;

    function update(value) {
      instance.update(value, 'image');
    }

    const file = container.querySelector('fieldset[name="upload"]');
    const link = container.querySelector('fieldset[name="url"]');

    const isURL = element.image.startsWith('http');

    container.querySelectorAll('[data-editing="image"] .warn').forEach((el) => el.classList.add('hidden'));
    file.classList.add('hidden');
    link.classList.toggle('hidden', !isURL);

    select.options = this.#getOptions();
    select.placeholder = 'Select an image...';
    select.value = isURL ? 'url' : element.image || '';
    select.on('change', () => {
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
        select.options = this.#getOptions();
        select.value = id;
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

  #getOptions() {
    return ['url', 'upload', ...this.getImages()];
  }

  getImages() {
    return [];
  }
}
