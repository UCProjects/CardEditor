import Module from '../Module.js';

function updateActive(from, to) {
  if (from === to) return;
  from?.classList.remove('active');
  to.classList.add('active');
}

export default class CardModule extends Module {
  init() {
    super.init();

    // Bind edit events, name, description, image, soul, number,

    const { instance: editor , signal } = this;
    const { container, element } = editor;
    // TODO: simplify this
    container.querySelector('input[name="name"]').addEventListener('input', () => {
      // TODO
    }, { signal });

    container.querySelectorAll('input[type="number"]').forEach((number) => {
      number.addEventListener('input', () => {
        editor.update(number.value, number.name);
      }, { signal });
    });

    // TODO extras override
    const showSoul = element.isSpell();
    container.querySelector('fieldset.soul').style.display = showSoul ? 'block' : 'none';

    container.querySelector('[data-tribe="none"]')?.classList.toggle('active', !this.element.tribes.length);

    container.querySelectorAll('.monster').forEach((el) => {
      el.classList.toggle('hidden', element.isSpell());
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
        refreshTribes(container.querySelector('.tribes [data-tribe="none"]'));
        editor.update(tribes, 'tribes');
      }, { signal });
    });

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
      });
    });
  }
}
