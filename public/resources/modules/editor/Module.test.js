import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../color/textPicker.js', async () => {
  const { default: EventEmitter } = await import('../utils/EventEmitter.js');
  return { default: class extends EventEmitter { isOpen = false; } };
});

const { default: Module } = await import('./Module.js');

const type = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('Module generic input binding', () => {
  let container;
  let instance;

  beforeEach(() => {
    container = document.getElementById('editor');
    container.querySelectorAll('.extra-input').forEach((el) => el.remove());
    instance = {
      container,
      element: { name: 'Card', description: '', type: 'card' },
      update: vi.fn(),
    };
    new Module(instance).init();
  });

  it('binds the name field to the element', () => {
    type(container.querySelector('input[name="name"]'), 'Renamed');
    expect(instance.update).toHaveBeenCalledWith('Renamed', 'name');
  });

  it.each([
    ['the image search box', 'select', 'select-input'],
    ['the colour picker hex field', 'hex', 'picker-input'],
    ['the colour picker swatch', 'color', 'picker-native'],
  ])('leaves %s alone once it is in the dialog', (label, name, className) => {
    const input = document.createElement('input');
    input.name = name;
    input.className = `extra-input ${className}`;
    container.append(input);
    new Module(instance).init();
    type(input, 'abc123');
    expect(instance.update).not.toHaveBeenCalled();
  });
});
