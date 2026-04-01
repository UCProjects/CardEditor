const APP = 'app:';
const DATA = 'data:';

const keys = {
  element: (id) => `${DATA}el:${id}`,
  groups: `${APP}groups`,
  setting: (key) => `${APP}setting:${key}`, // TODO
  settings: `${APP}settings`,
  version: `${APP}version`,
};

/** @returns {string[]} */
export function getGroups() {
  const groups = localStorage.getItem(keys.groups);
  return groups ? JSON.parse(groups) : [];
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

/** @returns {object | undefined} */
export function getElement(id) {
  const item = localStorage.getItem(keys.element(id));
  return item ? JSON.parse(item) : undefined;
}

export function setElement(id, data) {
  localStorage.setItem(keys.element(id), JSON.stringify(data, reducer));
}

export function removeElement(id) {
  localStorage.removeItem(keys.element(id));
}

/** @returns {string[]} */
export function getSettings() {
  const groups = localStorage.getItem(keys.settings);
  return groups ? JSON.parse(groups) : [];
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