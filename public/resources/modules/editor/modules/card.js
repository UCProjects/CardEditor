import Module from '../module.js';

function updateSoul(from, to) {
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

    const showSoul = element.isSpell();
    container.querySelector('fieldset.soul').style.display = showSoul ? 'block' : 'none';

    container.querySelector('[data-tribe="none"]')?.classList.toggle('active', !this.element.tribes.length);

    container.querySelectorAll('.monster').forEach((el) => {
      el.classList.toggle('hidden', element.isSpell());
    });

    updateSoul(
      container.querySelector('.soul .selectable.active'),
      container.querySelector(`.soul .selectable${element.soul ? `.${element.soul}` : ''}`),
    );

    container.querySelectorAll('.soul .selectable').forEach((el) => {
      el.addEventListener('click', () => {
        const active = container.querySelector('.soul span.selectable.active');
        if (active === el) return;
        updateSoul(active, el);
        const soul = el.textContent;
        editor.update(soul === 'NONE' ? '' : soul, 'soul');
      });
    });
  }
}
