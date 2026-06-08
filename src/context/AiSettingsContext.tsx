import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDefaultAiConfig,
  loadAiConfig,
  saveAiConfig,
  testAiConnection,
  type AiConfig,
  type AiProviderType,
} from "../lib/classifier";

type AiSettingsContextValue = {
  config: AiConfig;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  error: string | null;
  message: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (patch: Partial<AiConfig>) => void;
  setProvider: (provider: AiProviderType) => void;
  save: () => Promise<void>;
  testConnection: () => Promise<void>;
  clearError: () => void;
};

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AiConfig>(getDefaultAiConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await loadAiConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const updateConfig = useCallback((patch: Partial<AiConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);

  const setProvider = useCallback((provider: AiProviderType) => {
    const defaults = getDefaultAiConfig(provider);
    setConfig((current) => ({
      ...current,
      provider,
      model: defaults.model,
      baseUrl: defaults.baseUrl,
      enabled: provider !== "local",
    }));
  }, []);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await saveAiConfig(config);
      setMessage("AI settings saved.");
      await refreshConfig();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save AI settings.");
    } finally {
      setSaving(false);
    }
  }, [config, refreshConfig]);

  const testConnection = useCallback(async () => {
    try {
      setTesting(true);
      setError(null);
      setMessage(null);
      const result = await testAiConnection(config);
      setMessage(result);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "AI connection test failed.");
    } finally {
      setTesting(false);
    }
  }, [config]);

  const value = useMemo(
    () => ({
      config,
      loading,
      saving,
      testing,
      error,
      message,
      refreshConfig,
      updateConfig,
      setProvider,
      save,
      testConnection,
      clearError: () => setError(null),
    }),
    [
      config,
      loading,
      saving,
      testing,
      error,
      message,
      refreshConfig,
      updateConfig,
      setProvider,
      save,
      testConnection,
    ],
  );

  return <AiSettingsContext.Provider value={value}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings() {
  const context = useContext(AiSettingsContext);
  if (!context) {
    throw new Error("useAiSettings must be used within AiSettingsProvider");
  }
  return context;
}
