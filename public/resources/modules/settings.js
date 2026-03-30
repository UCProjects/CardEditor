import EventEmitter from './eventManager.js';
import { tryOrErrorSync } from './toast/index.js';

/**
 * @typedef {{
 *  key: string;
 *  name: string;
 * }} SettingInfo
 *
 * @typedef {SettingInfo & {
 *  enabled?: boolean;
 * }} Setting
 */

/** @type {SettingInfo[]} */
const baseSettings = [{
  key: 'monsterSoul',
  name: 'Enable monster souls',
}];

const Key = 'settings';

class Settings extends EventEmitter {
  /** @type {Map<Setting['key'], Setting>} */
  #settings = new Map(baseSettings.map((setting) => [setting.key, setting]));

  get(key) {
    return this.#settings.get(key);
  }

  getAll() {
    /** @type {Setting[]} */
    const settings = [];
    this.#settings.forEach((setting) => settings.push({ ...setting }));
    return settings;
  }

  load() {
    /** @type {String[]} */
    const settings = tryOrErrorSync(() => JSON.parse(localStorage.getItem(Key))) || [];
    this.#settings.forEach((setting) => this.set(setting.key, settings.includes(setting.key)));
  }

  save() {
    const settings = [];
    this.#settings.forEach((setting) => {
      if (setting.enabled) settings.push(setting.key);
    });
    localStorage.setItem(Key, JSON.stringify(settings));
  }

  set(key, enabled = false) {
    const setting = this.get(key);
    if (!setting) return;
    const current = setting.enabled ?? false;
    if (current === enabled) return;
    setting.enabled = enabled;
    this.emit(key, enabled, current);
  }
}

export default new Settings();
