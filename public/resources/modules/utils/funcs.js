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

export function isBase64(string) {
  return /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(string);
}

/** @param {HTMLElement} el  */
export function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();
  return rect.y > rect.height && rect.x > rect.width && // Below top of viewport
    rect.top >= 0 && rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}
