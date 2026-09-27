const APP = 'app:';
const DATA = 'data:';
const CORRUPT = `${APP}corrupt:`;

const keys = {
  element: (id) => `${DATA}el:${id}`,
  colors: `${APP}colors`,
  corrupt: (key, time = Date.now()) => `${CORRUPT}${key}:${time}`,
  groups: `${APP}groups`,
  setting: (key) => `${APP}setting:${key}`, // TODO
  settings: `${APP}settings`,
  version: `${APP}version`,
};

/** @returns {string[]} */
export function getColors() {
  return read(keys.colors, []);
}

export function setColors(colors) {
  localStorage.setItem(keys.colors, JSON.stringify(colors));
}

/** @returns {string[]} */
export function getGroups() {
  return read(keys.groups, []);
}

export function setGroups(ids) {
  localStorage.setItem(keys.groups, JSON.stringify(ids));
}

export function getVersion() {
  return localStorage.getItem(keys.version) ?? undefined;
}

export function setVersion(version) {
  localStorage.setItem(keys.version, version);
}

/** @returns {import('../elements/BaseElement.js').default | undefined} */
export function getElement(id) {
  return read(keys.element(id));
}

export function setElement(id, data) {
  localStorage.setItem(keys.element(id), JSON.stringify(data, reducer));
}

export function removeElement(id) {
  localStorage.removeItem(keys.element(id));
}

/** @returns {string[]} */
export function getSettings() {
  return read(keys.settings, []);
}

export function setSettings(value) {
  localStorage.setItem(keys.settings, JSON.stringify(value));
}

export function* getData() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(DATA)) yield [key, localStorage.getItem(key)];
  }
}

export function* getKeys() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(DATA)) yield key;
  }
}

export function clear() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith(DATA) || key?.startsWith(APP)) localStorage.removeItem(key);
  }
}

function reducer(_, value) {
  if (Array.isArray(value)) {
    if (!value.length) return undefined;
  } else if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return value;
}

function read(key, fallback) {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to read '${key}' from storage`, e);
    quarantine(key, data);
    return fallback;
  }
}

function quarantine(key, data) {
  const target = keys.corrupt(key);
  try {
    localStorage.setItem(target, data);
    localStorage.removeItem(key);
    console.error(`Corrupt '${key}' preserved at '${target}'`);
  } catch (e) {
    console.error(`Failed to preserve corrupt '${key}'`, e);
  }
}
