import { expect, vi } from 'vitest';
import settings, { Settings } from './settings.js';
import { getSettings, setSettings } from './utils/storage.js';


describe('SettingsManager', () => {
  it('Has Settings', () => {
    const allSettings = settings.getAll();
    const settingLength = Object.keys(Settings).length;
    expect(allSettings).to.be.length(settingLength);
  });

  it('Has All Settings', () => {
    for (const key of Object.values(Settings)) {
      expect(settings.get(key)).toBeDefined();
    }
  });

  it('Saves Value', () => {
    const key = Settings.MonsterSoul;
    expect(settings.enabled(key)).toBeFalsy();
    settings.set(key, true);
    expect(settings.enabled(key)).toBeTruthy();
  });

  it('Defaults to enabled when checked', () => {
    const setting = settings.get(Settings.SaveOnClose);
    expect(setting.checked).toBeTruthy();
    expect(setting.enabled).toBeTruthy();
  });

  it('saves a change straight away', () => {
    const key = Settings.SilenceOverlay;
    settings.set(key, true);
    expect(getSettings()).toContain(key);
    settings.set(key, false);
    expect(getSettings()).not.toContain(key);
  });

  it('stores a default-on setting only while it is turned off', () => {
    const key = Settings.SaveOnClose;
    settings.set(key, false);
    expect(getSettings()).toContain(key);
    settings.set(key, true);
    expect(getSettings()).not.toContain(key);
  });

  it('loads what was stored without writing while it loads', () => {
    const key = Settings.KeepTrash;
    setSettings([key]);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    settings.load();
    expect(write).not.toHaveBeenCalled();
    expect(settings.enabled(key)).toBe(true);
    write.mockRestore();
    settings.set(key, false);
  });
});
