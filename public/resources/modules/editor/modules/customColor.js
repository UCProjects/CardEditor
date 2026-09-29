import ValuePicker from '../../color/valuePicker.js';
import { isHashHex } from '../../utils/color.js';

/**
 * Wires the [data-custom] option of a text picker to a color picker.
 * @param {object} options
 * @param {HTMLElement} options.root container holding the .selectable options
 * @param {string} options.name dataset key the options carry their value in
 * @param {readonly string[]} options.presets values that are not custom colors
 * @param {string} options.value the element's current value
 * @param {(value: string) => void} options.activate marks the option for a preset value
 * @param {(value: string) => void} options.update writes a value to the element
 */
export default function customColor({ root, name, presets, value, activate, update }) {
  const custom = root.querySelector('[data-custom]');
  if (!custom) return null;

  const picker = new ValuePicker(custom);
  let previous = presets.includes(value) ? value : '';

  function paint(hex) {
    if (isHashHex(hex)) {
      custom.dataset[name] = hex;
      custom.style.setProperty('color', hex);
    } else {
      delete custom.dataset[name];
      custom.style.removeProperty('color');
    }
  }

  picker.on('change', (hex) => {
    paint(hex);
    const next = hex || previous;
    update(next);
    activate(next);
  });

  if (isHashHex(value)) paint(value);

  return {
    element: custom,
    isCustom: isHashHex(value),
    open(current) {
      const editing = isHashHex(current);
      if (!editing) previous = current;
      picker.open({
        hex: editing ? current : null,
        seed: custom.dataset[name],
      });
    },
  };
}
