import { GOOGLE_GSI_SCRIPT } from "./config";

let gsiScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_GSI_SCRIPT}"]`,
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load Google Sign-In.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_GSI_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Google Sign-In."));
      document.head.appendChild(script);
    });
  }

  return gsiScriptPromise;
}
