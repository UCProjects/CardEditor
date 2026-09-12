import { expect } from 'vitest';
import settings, { SettingKey } from './settings.js';


describe('SettingsManager', () => {
  it('Has Settings', () => {
    const allSettings = settings.getAll();
    const settingLength = Object.keys(SettingKey).length;
    expect(allSettings).to.be.length(settingLength);
  });

  it('Has All Settings', () => {
    for (const key of Object.values(SettingKey)) {
      expect(settings.get(key)).toBeDefined();
    }
  });

  it('Saves Value', () => {
    const key = SettingKey.MonsterSoul;
    expect(settings.enabled(key)).toBeFalsy();
    settings.set(key, true);
    expect(settings.enabled(key)).toBeTruthy();
  });

  it('Defaults to enabled when checked', () => {
    const setting = settings.get(SettingKey.SaveOnClose);
    expect(setting.checked).toBeTruthy();
    expect(setting.enabled).toBeTruthy();
  });

  it('saves/loads');
});
