import type { Connect } from "vite";

type OAuthProxyEnv = {
  GOOGLE_CLIENT_SECRET?: string;
};

export function createGmailOAuthProxyPlugin(env: OAuthProxyEnv) {
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

  return {
    name: "gmail-oauth-proxy",
    configureServer(server: { middlewares: { use: Connect.HandleFunction } }) {
      server.middlewares.use("/api/gmail/oauth/token", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        void (async () => {
          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            const body = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
            if (clientSecret && !body.has("client_secret")) {
              body.set("client_secret", clientSecret);
            }

            const response = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body,
            });

            const responseText = await response.text();
            res.statusCode = response.status;
            res.setHeader("Content-Type", "application/json");
            res.end(responseText);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "proxy_error",
                error_description:
                  error instanceof Error ? error.message : "OAuth proxy request failed.",
              }),
            );
          }
        })();
      });
    },
  };
}
