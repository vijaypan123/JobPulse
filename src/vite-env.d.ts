/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_BUILTIN_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface CodeResponse {
        code?: string;
        scope?: string;
        error?: string;
        error_description?: string;
      }

      interface CodeClientConfig {
        client_id: string;
        scope: string;
        ux_mode?: "popup" | "redirect";
        callback: (response: CodeResponse) => void;
      }

      interface CodeClient {
        requestCode: () => void;
      }

      function initCodeClient(config: CodeClientConfig): CodeClient;
    }
  }
}

interface Window {
  google?: typeof google;
}
