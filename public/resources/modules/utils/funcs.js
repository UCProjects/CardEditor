import { contains } from './array.js';

export function adoptStyle(...sheets) {
  if (import.meta.env) return;
  const styles = document.adoptedStyleSheets;
  sheets.forEach((sheet) => {
    if (!styles.includes(sheet)) styles.push(sheet);
  });
}

export function removeClass(...classes) {
  document.querySelectorAll(`.${classes[0]}`).forEach((e) => e.classList.remove(...classes));
}

export function setClasses(container, selector, ...classes) {
  const classList = container.querySelector(selector)?.classList;
  if (!classList) throw new Error(`Failed to find class list '${selector}'`);
  classList.remove(...classList); // Clear classes
  classList.add(...classes.flat());
}

export function setText(container, selector, value) {
  const element = container.querySelector(selector);
  if (!element) throw new Error(`Failed to find element '${selector}'`);
  element.textContent = value;
}

export function getFunctions(obj, ...ignore) {
  ignore.push('constructor');
  return Object.getOwnPropertyNames(obj)
    .filter((prop) => !ignore.includes(prop) && typeof obj[prop] === 'function');
}

export function getProps(obj, ...ignore) {
  ignore.push('__proto__');
  return Object.entries(Object.getOwnPropertyDescriptors(Reflect.getPrototypeOf(obj)))
    .filter(([prop, descriptor]) => !ignore.includes(prop) && typeof descriptor.get === 'function')
    .map(([prop]) => prop);
}

export function hasKey(obj, ...values) {
  if (!obj) return false;
  return values.some((key) => Object.hasOwn(obj, key));
}

export function hasValue(obj, ...values) {
  return contains(Object.values(obj), values);
}

/** @param {HTMLElement} el  */
export function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

export function clampNumber(number, max = 999, min = 0) {
  return Math.min(Math.max(min, Number(number)), max);
}
