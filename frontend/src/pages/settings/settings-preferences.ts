export interface SettingsPreferences {
    compactMode: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    autoRefresh: boolean;
    destructiveActionConfirmation: boolean;
}

export const defaultSettingsPreferences: SettingsPreferences = {
    compactMode: false,
    emailNotifications: true,
    smsNotifications: false,
    autoRefresh: true,
    destructiveActionConfirmation: true,
};

const STORAGE_KEY = 'hakimi-settings-preferences';

export function loadSettingsPreferences(): SettingsPreferences {
    if (typeof window === 'undefined') {
        return defaultSettingsPreferences;
    }

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return defaultSettingsPreferences;
        }

        const parsed = JSON.parse(stored) as Partial<SettingsPreferences>;
        return {
            ...defaultSettingsPreferences,
            ...parsed,
        };
    } catch {
        return defaultSettingsPreferences;
    }
}

export function saveSettingsPreferences(preferences: SettingsPreferences): SettingsPreferences {
    const nextPreferences = {
        ...defaultSettingsPreferences,
        ...preferences,
    };

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
    }

    return nextPreferences;
}
