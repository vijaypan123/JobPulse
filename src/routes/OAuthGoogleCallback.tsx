import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { completeGmailOAuth } from "../lib/gmail";

export function OAuthGoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Connecting Gmail...");

  useEffect(() => {
    async function finishOAuth() {
      const error = searchParams.get("error");
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (error) {
        setMessage(`Google OAuth failed: ${error}`);
        return;
      }

      if (!code || !state) {
        setMessage("Missing OAuth response from Google.");
        return;
      }

      try {
        await completeGmailOAuth(code, state);
        navigate("/settings/email?connected=1", { replace: true });
      } catch (oauthError) {
        setMessage(
          oauthError instanceof Error
            ? oauthError.message
            : "Could not complete Gmail connection.",
        );
      }
    }

    void finishOAuth();
  }, [navigate, searchParams]);

  return (
    <div className="oauth-page">
      <div className="card oauth-card">
        <h2>Gmail Connection</h2>
        <p>{message}</p>
        {message !== "Connecting Gmail..." ? (
          <Link className="button secondary" to="/settings/email">
            Back to Email Settings
          </Link>
        ) : null}
      </div>
    </div>
  );
}
