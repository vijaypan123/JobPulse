import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useApplications } from "./ApplicationsContext";
import {
  completeGmailOAuthPopup,
  disconnectGmail,
  getBuiltinClientId,
  GMAIL_SYNC_INTERVAL_MS,
  importGmailMessages,
  isBuiltinGmailConfigured,
  isCustomGmailConfigured,
  isGmailConfigured,
  isGmailConnected,
  loadGmailAuthState,
  startGmailOAuth,
  type GmailAuthState,
  type GmailImportSummary,
} from "../lib/gmail";
import { getSetting } from "../lib/db";
import { reclassifyImportedEmails, type ReclassifySummary } from "../lib/processEmail";
import { GMAIL_LAST_SYNC_SETTING_KEY } from "../lib/gmail/config";

type GmailContextValue = {
  configured: boolean;
  builtinAvailable: boolean;
  customAvailable: boolean;
  builtinClientId: string | null;
  connected: boolean;
  authState: GmailAuthState | null;
  lastSyncAt: string | null;
  syncing: boolean;
  error: string | null;
  connectGmailCustom: () => Promise<void>;
  completeBuiltinSignIn: (code: string) => Promise<void>;
  disconnect: () => Promise<void>;
  syncNow: () => Promise<GmailImportSummary | null>;
  reclassifyWithAi: () => Promise<ReclassifySummary | null>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
};

const GmailContext = createContext<GmailContextValue | null>(null);

export function GmailProvider({ children }: { children: ReactNode }) {
  const { refreshApplications } = useApplications();
  const [configured] = useState(isGmailConfigured());
  const [builtinAvailable] = useState(isBuiltinGmailConfigured());
  const [customAvailable] = useState(isCustomGmailConfigured());
  const [builtinClientId] = useState(getBuiltinClientId());
  const [connected, setConnected] = useState(false);
  const [authState, setAuthState] = useState<GmailAuthState | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const isConnected = await isGmailConnected();
    const savedAuth = await loadGmailAuthState();
    const lastSync = await getSetting(GMAIL_LAST_SYNC_SETTING_KEY);

    setConnected(isConnected);
    setAuthState(savedAuth);
    setLastSyncAt(lastSync);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const syncNow = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const summary = await importGmailMessages();
      await refreshApplications();
      await refreshStatus();
      return summary;
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Gmail sync failed.");
      return null;
    } finally {
      setSyncing(false);
    }
  }, [refreshApplications, refreshStatus]);

  const reclassifyWithAi = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const summary = await reclassifyImportedEmails();
      await refreshApplications();
      await refreshStatus();
      return summary;
    } catch (reclassifyError) {
      setError(
        reclassifyError instanceof Error ? reclassifyError.message : "AI reclassification failed.",
      );
      return null;
    } finally {
      setSyncing(false);
    }
  }, [refreshApplications, refreshStatus]);

  useEffect(() => {
    if (!connected) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void syncNow();
    }, GMAIL_SYNC_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [connected, syncNow]);

  const connectGmailCustom = useCallback(async () => {
    setError(null);
    await startGmailOAuth("custom");
  }, []);

  const completeBuiltinSignIn = useCallback(
    async (code: string) => {
      if (!builtinClientId) {
        throw new Error("Built-in Sign in with Google is not configured for this build.");
      }

      setError(null);
      await completeGmailOAuthPopup(code, builtinClientId);
      await refreshStatus();
      await syncNow();
    },
    [builtinClientId, refreshStatus, syncNow],
  );

  const disconnect = useCallback(async () => {
    await disconnectGmail();
    await refreshStatus();
  }, [refreshStatus]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      configured,
      builtinAvailable,
      customAvailable,
      builtinClientId,
      connected,
      authState,
      lastSyncAt,
      syncing,
      error,
      connectGmailCustom,
      completeBuiltinSignIn,
      disconnect,
      syncNow,
      reclassifyWithAi,
      refreshStatus,
      clearError,
    }),
    [
      configured,
      builtinAvailable,
      customAvailable,
      builtinClientId,
      connected,
      authState,
      lastSyncAt,
      syncing,
      error,
      connectGmailCustom,
      completeBuiltinSignIn,
      disconnect,
      syncNow,
      reclassifyWithAi,
      refreshStatus,
      clearError,
    ],
  );

  return <GmailContext.Provider value={value}>{children}</GmailContext.Provider>;
}

export function useGmail() {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error("useGmail must be used within GmailProvider");
  }
  return context;
}
