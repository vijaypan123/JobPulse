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
  createApplication,
  deleteApplication,
  getApplications,
  initializeDatabase,
  updateApplication,
} from "../lib/db";
import type { Application, ApplicationInput } from "../lib/types";

type ApplicationsContextValue = {
  applications: Application[];
  loading: boolean;
  error: string | null;
  refreshApplications: () => Promise<void>;
  addApplication: (input: ApplicationInput) => Promise<void>;
  editApplication: (id: number, input: ApplicationInput) => Promise<void>;
  removeApplication: (id: number) => Promise<void>;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshApplications = useCallback(async () => {
    const rows = await getApplications();
    setApplications(rows);
  }, []);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        setLoading(true);
        setError(null);
        await initializeDatabase();
        const rows = await getApplications();
        if (active) {
          setApplications(rows);
        }
      } catch (bootError) {
        if (active) {
          setError(
            bootError instanceof Error
              ? bootError.message
              : "Failed to initialize the local database.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, []);

  const addApplication = useCallback(async (input: ApplicationInput) => {
    await createApplication(input);
    await refreshApplications();
  }, [refreshApplications]);

  const editApplication = useCallback(
    async (id: number, input: ApplicationInput) => {
      await updateApplication(id, input);
      await refreshApplications();
    },
    [refreshApplications],
  );

  const removeApplication = useCallback(
    async (id: number) => {
      await deleteApplication(id);
      await refreshApplications();
    },
    [refreshApplications],
  );

  const value = useMemo(
    () => ({
      applications,
      loading,
      error,
      refreshApplications,
      addApplication,
      editApplication,
      removeApplication,
    }),
    [
      applications,
      loading,
      error,
      refreshApplications,
      addApplication,
      editApplication,
      removeApplication,
    ],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error("useApplications must be used within ApplicationsProvider");
  }
  return context;
}
