import { asArray } from '../../utils/array.js';
import { clampNumber } from '../../utils/funcs.js';
import { object } from '../../utils/smart.js';
import Module from './ImageModule.js';

function updateActive(from, to) {
  if (from === to) return;
  from?.classList.remove('active');
  to.classList.add('active');
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

    // TODO: simplify events

    // Stats
    container.querySelectorAll('input[type="number"]:not(.external > input)').forEach((input) => {
      const key = input.name;
      input.value = element[key];

      // Only allow positive integers
      input.addEventListener('beforeinput', positiveInputListener, { signal });

      input.addEventListener('input', () => {
        const value = clampNumber(input.value);
        input.value = value;
        editor.update(value, input.name);
      }, { signal });
    });

    // Extras
    const hideExtra = String(element.isSpell()); // TODO extras override
    container.querySelectorAll('[data-extra]').forEach((el) => {
      const { extra = 'true' } = el.dataset;
      el.classList.toggle('hidden', hideExtra === extra);
    });

    updateActive(
      container.querySelector('.soul .selectable.active'),
      container.querySelector(`.soul .selectable${element.soul ? `.${element.soul}` : ''}`),
    );

    container.querySelectorAll('.soul .selectable').forEach((el) => {
      el.addEventListener('click', () => {
        const active = container.querySelector('.soul span.selectable.active');
        if (active === el) return;
        updateActive(active, el);
        const soul = el.textContent;
        editor.update(soul === 'NONE' ? '' : soul, 'soul');
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

    container.querySelectorAll('[data-tribe].selectable').forEach((el) => {
      refreshTribes(el);

      el.addEventListener('click', () => {
        const { tribe } = el.dataset;
        const { tribes } = element;
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
        refreshTribes(...container.querySelectorAll('[data-tribe].selectable'));
        editor.update(tribes, 'tribes');
      }, { signal });
    });

    // rarity
    updateActive(
      container.querySelector('[data-rarity].active'),
      container.querySelector(`[data-rarity="${element.rarity || 'COMMON'}"]`),
    );

    container.querySelectorAll('[data-rarity].selectable').forEach((el) => {
      const { rarity } = el.dataset;
      el.addEventListener('click', () => {
        const active = container.querySelector('[data-rarity].active');
        if (active === el) return;
        updateActive(active, el);
        editor.update(rarity, 'rarity');
      }, { signal });
    });

    // effects
    const effects = object();
    const effectList = document.getElementById('effects');
    const activeList = document.querySelector('[data-editing="effects"] .activeList');
    const effectSet = activeList.parentElement;
    const empty = effectSet.querySelector('.empty');

    function updateEffects() {
      const data = effects.entries().map((entry) => {
        const [key, value] = entry;
        if (!value) return key;
        return entry;
      });
      editor.update(data, 'effects');
    }

    activeList.innerHTML = ''; // Clear

    function addActive(effect, count = 0) {
      const row = document.importNode(effectRow.content, true);
      const [wrapper] = row.children;

      const img = row.querySelector('img');
      img.src = `/resources/images/effects/${effect}.png`;
      img.alt = effect;

      const input = row.querySelector('input');
      input.value = count;
      input.addEventListener('beforeinput', positiveInputListener);
      input.addEventListener('input', (e) => {
        const value = clampNumber(input.value, 99);
        input.value = value;
        effects[effect] = value;
        updateEffects();
      });

      // Remove
      const remove = row.querySelector('button.remove');
      remove.addEventListener('click', () => {
        effectList.querySelector(`[data-value="${effect}"]`).classList.remove('hidden');
        wrapper.remove();
        delete effects[effect];
        empty.classList.toggle('hidden', effects.size);
        updateEffects();
      });

      // It's new
      if (!effects.has(effect)) {
        effects[effect] = count;
        updateEffects();
      }

      activeList.appendChild(row);
    }

    element.effects.forEach((data) => {
      const [effect, count = 0] = asArray(data);
      effects[effect] = count;
      addActive(effect, count);
    });

    effectList.querySelectorAll('[data-value]').forEach((el) => {
      const effect = el.dataset.value;
      el.classList.toggle('hidden', effects.has(effect));
      el.addEventListener('click', () => {
        el.classList.add('hidden');
        addActive(effect);
        empty.classList.add('hidden');
      }, { signal });
    });

    empty.classList.toggle('hidden', effects.size);
  }
}
