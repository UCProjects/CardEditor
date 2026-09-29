import { getAll, getURL, ImageType } from '../../imageBank.js';
import settings, { Settings } from '../../settings.js';
import { asArray } from '../../utils/array.js';
import { clampNumber } from '../../utils/funcs.js';
import { isHashHex } from '../../utils/color.js';
import { Souls } from '../../elements/types.js';
import customColor from './customColor.js';
import Module from './ImageModule.js';

function updateActive(from, to) {
  if (from === to) return;
  from?.classList.remove('active');
  to?.classList.add('active');
}

/** @type {HTMLTemplateElement} */
const effectRow = document.getElementById('effectRow');

/** @param {InputEvent} e  */
function positiveInputListener(e) {
  if (e.inputType.startsWith('deleteContent')) return;
  if (!/^\d+$/.test(e.data)) e.preventDefault();
}


export default class CardModule extends Module {
  init() {
    super.init();

    const { container, instance: editor, element, signal } = this;

    // Stats
    container.querySelectorAll('input[type="number"]:not(.external > input)').forEach((input) => {
      const key = input.name;
      input.value = element[key];

      // Only allow positive integers
      input.addEventListener('beforeinput', positiveInputListener, { signal });

      input.addEventListener('input', () => {
        const value = clampNumber(input.value);
        input.value = value;
        editor.update(value, key);
      }, { signal });
    });

    // Stats
    const enableSoul = element.isSpell() || settings.enabled(Settings.MonsterSoul);
    container.querySelectorAll('[data-extra]:not([data-insert] > [data-extra])').forEach((el) => {
      const { extra } = el.dataset;
      el.classList.toggle('hidden', extra === 'soul' ? !enableSoul : element.isSpell());
    });

    const souls = container.querySelector('.soul');
    const presetSoul = (soul) => souls.querySelector(`.selectable[data-soul="${Souls.includes(soul) ? soul : ''}"]`);
    const activeSoul = () => souls.querySelector('.selectable.active');

    const soul = customColor({
      root: souls,
      name: 'soul',
      presets: Souls,
      value: element.soul,
      activate: (value) => updateActive(activeSoul(), isHashHex(value) ? soul.element : presetSoul(value)),
      update: (value) => editor.update(value, 'soul'),
    });

    updateActive(activeSoul(), soul?.isCustom ? soul.element : presetSoul(element.soul));

    souls.querySelectorAll('.selectable').forEach((el) => {
      el.addEventListener('click', () => {
        const active = activeSoul();
        if (el === soul?.element) {
          soul.open(element.soul);
          return;
        }
        if (active === el) return;
        updateActive(active, el);
        editor.update(el.dataset.soul, 'soul');
      }, { signal });
    });

    // tribes
    function refreshTribes(...elements) {
      elements.forEach((el) => {
        const { tribe } = el.dataset;
        const { tribes } = element;
        el.classList.toggle('active', tribes.length ?
          tribes.includes(tribe) :
          tribe === 'none'
        );
      });
    }

    function allTribes() {
      return container.querySelectorAll('[data-tribe].selectable');
    }

    refreshTribes(...allTribes());

    container.addEventListener('click', (e) => {
      const el = e.target.closest('[data-tribe].selectable');
      if (!el) return;
      const { tribe } = el.dataset;
      const tribes = [...element.tribes];
      const index = tribes.indexOf(tribe);
      if (!~index) { // Doesn't exist
        if (tribe === 'all' || tribe === 'none') {
          tribes.splice(0, tribes.length);
        }
        if (tribe !== 'none') {
          if (tribe !== 'all' && tribes.includes('all')) {
            tribes.splice(tribes.indexOf('all'), 1);
          }
          tribes.push(tribe);
        }
      } else {
        tribes.splice(index, 1);
      }
      editor.update(tribes, 'tribes');
      refreshTribes(...allTribes());
    }, { signal });

    // rarity
    const rarities = container.querySelector('[data-editing="rarity"]');

    updateActive(
      rarities.querySelector('[data-rarity].active'),
      rarities.querySelector(`[data-rarity="${element.rarity || 'COMMON'}"]`),
    );

    rarities.addEventListener('click', (e) => {
      const el = e.target.closest('[data-rarity].selectable');
      if (!el) return;
      const active = rarities.querySelector('[data-rarity].active');
      if (active === el) return;
      updateActive(active, el);
      editor.update(el.dataset.rarity, 'rarity');
    }, { signal });

    // effects
    const effects = new Map();
    const effectList = document.querySelector('[data-editing="effects"]');
    const activeList = document.querySelector('[data-editing="effects"] .activeList');
    const effectSet = activeList.parentElement;
    const empty = effectSet.querySelector('.empty');

    function updateEffects() {
      const data = [];
      effects.forEach((value, key) => {
        if (!value) {
          data.push(key);
        } else {
          data.push([key, value]);
        }
      });
      editor.update(data, 'effects');
    }

    activeList.innerHTML = ''; // Clear

    function addActive(effect, count = 0) {
      const row = document.importNode(effectRow.content, true);
      const [wrapper] = row.children;

      const img = row.querySelector('img');
      img.src = getURL(effect, ImageType.Effect);
      img.alt = effect;

      const input = row.querySelector('input');
      input.value = count;
      input.addEventListener('beforeinput', positiveInputListener);
      input.addEventListener('input', (e) => {
        const value = clampNumber(input.value, 99);
        input.value = value;
        effects.set(effect, value);
        updateEffects();
      });

      // Remove
      const remove = row.querySelector('button.remove');
      remove.addEventListener('click', () => {
        effectList.querySelector(`[data-value="${effect}"]`)?.classList.remove('hidden');
        wrapper.remove();
        effects.delete(effect);
        empty.classList.toggle('hidden', effects.size);
        updateEffects();
      });

      // It's new
      if (!effects.has(effect)) {
        effects.set(effect, count);
        updateEffects();
      }

      activeList.appendChild(row);
    }

    element.effects.forEach((data) => {
      const [effect, count = 0] = asArray(data);
      effects.set(effect, count);
      addActive(effect, count);
    });

    effectList.querySelectorAll('[data-value]').forEach((el) => {
      el.classList.toggle('hidden', effects.has(el.dataset.value));
    });

    effectList.addEventListener('click', (e) => {
      const el = e.target.closest('[data-value]');
      if (!el) return;
      el.classList.add('hidden');
      addActive(el.dataset.value);
      empty.classList.add('hidden');
    }, { signal });

    empty.classList.toggle('hidden', effects.size);
  }

  getImages() {
    const images = Object.entries(getAll(ImageType.Avatar));
    return [{
      label: 'Your Avatars',
      items: images.map(([key, item]) => {
        if (typeof item === 'string') return null;
        return key;
      }).filter(Boolean),
    }, {
      label: 'Vanilla',
      items: images.map(([key, item]) => {
        if (typeof item === 'string') return key;
        return null;
      }).filter(Boolean),
    }];
  }
}
