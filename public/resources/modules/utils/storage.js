const APP = 'app:';
const DATA = 'data:';
const CORRUPT = `${APP}corrupt:`;
const TRASH = `${DATA}trash:`;

const keys = {
  element: (id) => `${DATA}el:${id}`,
  trash: (id) => `${TRASH}${id}`,
  colors: `${APP}colors`,
  corrupt: (key, time = Date.now()) => `${CORRUPT}${key}:${time}`,
  groups: `${APP}groups`,
  settings: `${APP}settings`,
  version: `${APP}version`,
};

let cleared = false;

/** @returns {string[]} */
export function getColors() {
  return read(keys.colors, []);
}

export function setColors(colors) {
  write(keys.colors, JSON.stringify(colors));
}

/** @returns {string[]} */
export function getGroups() {
  return read(keys.groups, []);
}

export function setGroups(ids) {
  write(keys.groups, JSON.stringify(ids));
}

export function getVersion() {
  return localStorage.getItem(keys.version) ?? undefined;
}

export function setVersion(version) {
  write(keys.version, version);
}

/** @returns {import('../elements/BaseElement.js').default | undefined} */
export function getElement(id) {
  return read(keys.element(id));
}

export function setElement(id, data) {
  write(keys.element(id), JSON.stringify(data, reducer));
}

export function removeElement(id) {
  localStorage.removeItem(keys.element(id));
}

/**
 * @typedef {{
 *  id: string;
 *  group?: string;
 *  element: object;
 * }} TrashRecord
 *
 * @returns {TrashRecord[]}
 */
export function getTrashed() {
  const records = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(TRASH)) continue;
    const record = read(key);
    if (record?.id) records.push(record);
  }
  return records;
}

/** @param {TrashRecord} record */
export function setTrashed(record) {
  write(keys.trash(record.id), JSON.stringify(record, reducer));
}

export function removeTrashed(id) {
  localStorage.removeItem(keys.trash(id));
}

export function clearTrashed() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith(TRASH)) localStorage.removeItem(key);
  }
}

/** @returns {string[]} */
export function getSettings() {
  return read(keys.settings, []);
}

export function setSettings(value) {
  write(keys.settings, JSON.stringify(value));
}

export function* getKeys() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(DATA)) yield key;
  }
}

export function* getCorrupt() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CORRUPT)) yield key;
  }
}

export function clearCorrupt() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith(CORRUPT)) localStorage.removeItem(key);
  }
}

export function clear() {
  cleared = true;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith(DATA) || key.startsWith(APP)) localStorage.removeItem(key);
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

function write(key, value) {
  if (cleared) return;
  localStorage.setItem(key, value);
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
