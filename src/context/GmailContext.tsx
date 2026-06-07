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
  disconnectGmail,
  GMAIL_SYNC_INTERVAL_MS,
  importGmailMessages,
  isGmailConnected,
  isGmailConfigured,
  loadGmailAuthState,
  startGmailOAuth,
  type GmailAuthState,
  type GmailImportSummary,
} from "../lib/gmail";
import { getSetting } from "../lib/db";
import { GMAIL_LAST_SYNC_SETTING_KEY } from "../lib/gmail/config";

type GmailContextValue = {
  configured: boolean;
  connected: boolean;
  authState: GmailAuthState | null;
  lastSyncAt: string | null;
  syncing: boolean;
  error: string | null;
  connectGmail: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncNow: () => Promise<GmailImportSummary | null>;
  refreshStatus: () => Promise<void>;
};

const GmailContext = createContext<GmailContextValue | null>(null);

export function GmailProvider({ children }: { children: ReactNode }) {
  const { refreshApplications } = useApplications();
  const [configured] = useState(isGmailConfigured());
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

  useEffect(() => {
    if (!connected) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void syncNow();
    }, GMAIL_SYNC_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [connected, syncNow]);

  const connectGmail = useCallback(async () => {
    setError(null);
    await startGmailOAuth();
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectGmail();
    await refreshStatus();
  }, [refreshStatus]);

  const value = useMemo(
    () => ({
      configured,
      connected,
      authState,
      lastSyncAt,
      syncing,
      error,
      connectGmail,
      disconnect,
      syncNow,
      refreshStatus,
    }),
    [
      configured,
      connected,
      authState,
      lastSyncAt,
      syncing,
      error,
      connectGmail,
      disconnect,
      syncNow,
      refreshStatus,
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
