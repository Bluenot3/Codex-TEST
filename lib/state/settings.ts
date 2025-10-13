import { STORAGE_KEYS, DEFAULT_MODEL_PROFILE } from "../constants";
import {
  clearSecureStore,
  exportSecureStore,
  getSecureItem,
  importSecureStore,
  removeSecureItem,
  setSecureItem,
} from "../crypto/secureStore";
import { createStore } from "./createStore";
import { isBrowser, safeJSONParse } from "../utils/guards";

export type ProviderKey = "openai" | "anthropic" | "google" | "mistral";

interface PersistedSettings {
  defaultProfile: string;
  telemetryOptIn: boolean;
  advancedProviders: boolean;
  availableModels: string[];
  lastUpdated: number;
}

export interface SettingsState extends PersistedSettings {
  ready: boolean;
  decryptedKeys: Partial<Record<ProviderKey, string>>;
  setDefaultProfile: (profile: string) => void;
  setTelemetryOptIn: (value: boolean) => void;
  toggleAdvancedProviders: () => void;
  setAvailableModels: (models: string[]) => void;
  hydrate: () => Promise<void>;
  storeKey: (provider: ProviderKey, key: string) => Promise<void>;
  forgetKey: (provider: ProviderKey) => Promise<void>;
  readKey: (provider: ProviderKey) => Promise<string | null>;
  exportSettings: () => Promise<string>;
  importSettings: (payload: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const loadPersisted = (): PersistedSettings => {
  if (!isBrowser()) {
    return {
      defaultProfile: DEFAULT_MODEL_PROFILE,
      telemetryOptIn: false,
      advancedProviders: false,
      availableModels: [],
      lastUpdated: Date.now(),
    };
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
  const parsed = safeJSONParse<PersistedSettings | null>(raw, null);
  const defaults: PersistedSettings = {
    defaultProfile: DEFAULT_MODEL_PROFILE,
    telemetryOptIn: false,
    advancedProviders: false,
    availableModels: [],
    lastUpdated: Date.now(),
  };
  return parsed ? { ...defaults, ...parsed } : defaults;
};

const persist = (state: PersistedSettings) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state));
};

export const useSettingsStore = createStore<SettingsState>((set, get) => ({
  ...loadPersisted(),
  ready: false,
  decryptedKeys: {},
  setDefaultProfile: (profile) => {
    const next = { ...get(), defaultProfile: profile, lastUpdated: Date.now() };
    set({ defaultProfile: profile, lastUpdated: next.lastUpdated });
    persist(next);
  },
  setTelemetryOptIn: (value) => {
    const next = { ...get(), telemetryOptIn: value, lastUpdated: Date.now() };
    set({ telemetryOptIn: value, lastUpdated: next.lastUpdated });
    persist(next);
  },
  toggleAdvancedProviders: () => {
    const current = get();
    const next = {
      ...current,
      advancedProviders: !current.advancedProviders,
      lastUpdated: Date.now(),
    };
    set({ advancedProviders: next.advancedProviders, lastUpdated: next.lastUpdated });
    persist(next);
  },
  setAvailableModels: (models) => {
    const next = { ...get(), availableModels: models, lastUpdated: Date.now() };
    set({ availableModels: models, lastUpdated: next.lastUpdated });
    persist(next);
  },
  hydrate: async () => {
    if (!isBrowser()) return;
    const providers: ProviderKey[] = ["openai", "anthropic", "google", "mistral"];
    const entries = await Promise.all(
      providers.map(async (provider) => {
        const key = await getSecureItem(`key:${provider}`);
        return [provider, key] as const;
      })
    );
    const decryptedKeys = entries.reduce<Partial<Record<ProviderKey, string>>>((acc, [provider, key]) => {
      if (key) acc[provider] = key;
      return acc;
    }, {});
    set({ decryptedKeys, ready: true });
  },
  storeKey: async (provider, key) => {
    await setSecureItem(`key:${provider}`, key.trim());
    const decryptedKeys = { ...get().decryptedKeys, [provider]: key.trim() };
    set({ decryptedKeys });
  },
  forgetKey: async (provider) => {
    await removeSecureItem(`key:${provider}`);
    const decrypted = { ...get().decryptedKeys };
    delete decrypted[provider];
    set({ decryptedKeys: decrypted });
  },
  readKey: async (provider) => {
    const memoryKey = get().decryptedKeys[provider];
    if (memoryKey) return memoryKey;
    const stored = await getSecureItem(`key:${provider}`);
    if (stored) {
      set({ decryptedKeys: { ...get().decryptedKeys, [provider]: stored } });
    }
    return stored;
  },
  exportSettings: async () => {
    const secure = await exportSecureStore();
    const { decryptedKeys: _discard, ready: _ready, ...rest } = get();
    const persisted: PersistedSettings = {
      defaultProfile: rest.defaultProfile,
      telemetryOptIn: rest.telemetryOptIn,
      advancedProviders: rest.advancedProviders,
      availableModels: rest.availableModels,
      lastUpdated: Date.now(),
    };
    return JSON.stringify({ secure, settings: persisted }, null, 2);
  },
  importSettings: async (payload) => {
    const parsed = safeJSONParse<{ secure?: string; settings?: PersistedSettings }>(payload, { secure: "{}" });
    if (parsed.secure) {
      await importSecureStore(parsed.secure);
    }
    if (parsed.settings) {
      persist(parsed.settings);
      set({ ...parsed.settings });
    }
    await get().hydrate();
  },
  clearAll: async () => {
    await clearSecureStore();
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEYS.settings);
    }
    set({
      ...loadPersisted(),
      decryptedKeys: {},
      ready: true,
    });
  },
}));
