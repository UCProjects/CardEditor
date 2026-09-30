import EventEmitter from './utils/EventEmitter.js';
import { getSettings, setSettings } from './utils/storage.js';

export const Settings = Object.freeze({
  AddDetermination: 'addDetermination',
  GameTextSize: 'gameTextSize',
  KeepTrash: 'keepTrash',
  MonsterSoul: 'monsterSoul',
  SaveOnClose: 'editorSave',
  SilenceOverlay: 'silenceOverlay',
});

/**
 * @typedef {{
 *  key: string;
 *  name: string;
 *  checked?: boolean;
 * }} SettingInfo
 *
 * @typedef {SettingInfo & {
 *  enabled?: boolean;
 * }} Setting
 *
 * @typedef {SettingKey[keyof SettingKey]} SettingKeys
 */

/** @type {SettingInfo[]} */
const baseSettings = [{
  key: Settings.MonsterSoul,
  name: 'Enable monster souls',
}, {
  key: Settings.GameTextSize,
  name: 'Match in-game text size',
}, {
  key: Settings.AddDetermination,
  name: 'Automatically add <img src="/resources/images/effects/Determination.png" /> to <span class="DETERMINATION">DT</span> cards',
  checked: true,
}, {
  key: Settings.SilenceOverlay,
  name: 'Show silence over silenced cards',
}, {
  key: Settings.SaveOnClose,
  name: 'Save editor on close',
  checked: true,
}, {
  key: Settings.KeepTrash,
  name: 'Keep trash between sessions',
}];

class SettingManager extends EventEmitter {
  /** @type {Map<Setting['key'], Setting>} */
  #settings = new Map(baseSettings.map((setting) => [setting.key, {
    ...setting,
    enabled: setting.checked ?? false,
  }]));

  /**
   * @param {SettingKeys} key
   * @returns {boolean}
   */
  enabled(key) {
    return this.get(key)?.enabled ?? false;
  }

  /**
   * @param {SettingKeys} key
   * @returns {Setting | null}
   */
  get(key) {
    const setting = this.#settings.get(key);
    return setting ? { ...setting } : null;
  }

  getAll() {
    /** @type {Setting[]} */
    const settings = [];
    this.#settings.forEach((setting) => settings.push({ ...setting }));
    return settings;
  }

  load() {
    const settings = getSettings();
    this.#settings.forEach(({ checked = false, key }) => this.set(
      key,
      settings.includes(key) !== checked,
    ));
  }

  save() {
    const settings = [];
    this.#settings.forEach(({ checked = false, enabled = false, key }) => {
      if (enabled !== checked) settings.push(key);
    });
    setSettings(settings);
  }

  set(key, enabled = false) {
    const setting = this.#settings.get(key);
    if (!setting) return;
    const { enabled: current = false } = setting;
    if (current === enabled) return;
    setting.enabled = enabled;
    this.emit(key, enabled, current);
  }
}

export default new SettingManager();
