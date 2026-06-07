import { useEffect, useRef, useState } from "react";
import { GMAIL_READONLY_SCOPE } from "../lib/gmail/config";
import { loadGoogleIdentityScript } from "../lib/gmail/gsi";

type GoogleSignInButtonProps = {
  clientId: string;
  disabled?: boolean;
  onSuccess: (code: string) => Promise<void>;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({
  clientId,
  disabled = false,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const codeClientRef = useRef<google.accounts.oauth2.CodeClient | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function initClient() {
      try {
        await loadGoogleIdentityScript();
        if (!active || !window.google?.accounts?.oauth2) {
          return;
        }

        codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: GMAIL_READONLY_SCOPE,
          ux_mode: "popup",
          callback: (response) => {
            setLoading(false);

            if (response.error) {
              onError?.(response.error_description ?? response.error);
              return;
            }

            if (!response.code) {
              onError?.("Google did not return an authorization code.");
              return;
            }

            void onSuccess(response.code).catch((error) => {
              onError?.(
                error instanceof Error ? error.message : "Could not complete Google sign-in.",
              );
            });
          },
        });

        setReady(true);
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : "Could not initialize Google Sign-In.",
        );
      }
    }

    void initClient();

    return () => {
      active = false;
    };
  }, [clientId, onError, onSuccess]);

  return (
    <button
      className="google-signin-button"
      type="button"
      disabled={disabled || !ready || loading}
      onClick={() => {
        setLoading(true);
        codeClientRef.current?.requestCode();
      }}
    >
      <span className="google-signin-icon" aria-hidden="true">
        G
      </span>
      <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
    </button>
  );
}
