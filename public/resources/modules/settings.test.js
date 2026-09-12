import { expect } from 'vitest';
import settings, { Settings } from './settings.js';


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

  it('saves/loads');
});
