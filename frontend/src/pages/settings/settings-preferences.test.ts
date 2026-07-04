import { beforeEach, describe, expect, it } from 'vitest';
import {
    defaultSettingsPreferences,
    loadSettingsPreferences,
    saveSettingsPreferences,
} from './settings-preferences';

describe('settings preferences', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('returns default preferences when nothing is stored', () => {
        expect(loadSettingsPreferences()).toEqual(defaultSettingsPreferences);
    });

    it('persists and reloads preferences', () => {
        const preferences = {
            ...defaultSettingsPreferences,
            compactMode: true,
            emailNotifications: false,
            smsNotifications: true,
        };

        saveSettingsPreferences(preferences);

        expect(loadSettingsPreferences()).toEqual(preferences);
    });
});
