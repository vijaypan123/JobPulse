import { Link } from "react-router-dom";
import { useState } from "react";
import { useAiSettings } from "../context/AiSettingsContext";
import { useGmail } from "../context/GmailContext";
import {
  providerLabel,
  providerRequiresApiKey,
  type AiDataMode,
  type AiProviderType,
} from "../lib/classifier";

const PROVIDERS: AiProviderType[] = ["local", "ollama", "gemini", "openai_compatible"];

export function SettingsAi() {
  const {
    config,
    loading,
    saving,
    testing,
    error,
    message,
    updateConfig,
    setProvider,
    save,
    testConnection,
  } = useAiSettings();
  const { connected, syncing, reclassifyWithAi } = useGmail();
  const [reclassifyMessage, setReclassifyMessage] = useState<string | null>(null);

  const aiActive = config.enabled && config.provider !== "local";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>AI Settings</h2>
          <p>
            Optional AI classification for better company, role, and status detection. Local rules
            remain the default and are used as a fallback if AI fails.
          </p>
        </div>
        <Link className="button secondary" to="/settings">
          Back to Settings
        </Link>
      </header>

      <section className="settings-grid">
        <div className="card settings-card">
          <h3>AI Processing</h3>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.enabled && config.provider !== "local"}
              disabled={loading}
              onChange={(event) => {
                const enabled = event.target.checked;
                updateConfig({
                  enabled,
                  provider: enabled && config.provider === "local" ? "ollama" : config.provider,
                });
                if (enabled && config.provider === "local") {
                  setProvider("ollama");
                }
              }}
            />
            <span>Enable AI classification</span>
          </label>

          <label>
            Provider
            <select
              className="select-input"
              value={config.provider}
              disabled={loading}
              onChange={(event) => setProvider(event.target.value as AiProviderType)}
            >
              {PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {providerLabel(provider)}
                </option>
              ))}
            </select>
          </label>

          {config.provider === "ollama" ? (
            <p className="settings-note">
              Free and local. Install{" "}
              <a href="https://ollama.com" target="_blank" rel="noreferrer">
                Ollama
              </a>
              , run <code>ollama pull llama3.2</code>, then test the connection below.
            </p>
          ) : null}

          {config.provider === "gemini" ? (
            <p className="settings-note">
              Free tier from{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
              . Use an <strong>AI Studio API key</strong> — not your Gmail OAuth client ID/secret.
              Recommended model: <code>gemini-2.0-flash-lite</code>.
            </p>
          ) : null}

          {config.provider === "openai_compatible" ? (
            <p className="settings-note">
              Works with Groq, OpenRouter, or any OpenAI-compatible endpoint. Groq offers a free
              tier at <code>https://api.groq.com/openai/v1</code>.
            </p>
          ) : null}
        </div>

        <div className="card settings-card">
          <h3>Connection</h3>

          {config.provider !== "local" ? (
            <>
              <label>
                Model
                <input
                  className="search-input"
                  value={config.model}
                  onChange={(event) => updateConfig({ model: event.target.value })}
                  placeholder="llama3.2"
                />
              </label>

              <label>
                Base URL
                <input
                  className="search-input"
                  value={config.baseUrl}
                  onChange={(event) => updateConfig({ baseUrl: event.target.value })}
                  placeholder="http://localhost:11434"
                />
              </label>

              {providerRequiresApiKey(config.provider) ? (
                <label>
                  API key
                  <input
                    className="search-input"
                    type="password"
                    value={config.apiKey}
                    onChange={(event) => updateConfig({ apiKey: event.target.value })}
                    placeholder="Paste your API key"
                    autoComplete="off"
                  />
                </label>
              ) : null}

              <label>
                Data sent for classification
                <select
                  className="select-input"
                  value={config.dataMode}
                  onChange={(event) =>
                    updateConfig({ dataMode: event.target.value as AiDataMode })
                  }
                >
                  <option value="subject">Subject only</option>
                  <option value="subject_snippet">Subject + snippet (recommended)</option>
                  <option value="body">Subject + snippet + body</option>
                </select>
              </label>
            </>
          ) : (
            <p className="settings-note">
              Local rules mode sends no email content to any AI provider.
            </p>
          )}

          <div className="export-actions">
            <button className="button" type="button" disabled={saving || loading} onClick={() => void save()}>
              {saving ? "Saving..." : "Save AI Settings"}
            </button>
            {config.provider !== "local" ? (
              <button
                className="button secondary"
                type="button"
                disabled={testing || loading}
                onClick={() => void testConnection()}
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="card settings-card">
          <h3>Privacy</h3>
          <ul className="settings-list">
            <li>
              <strong>Local rules:</strong> no email content leaves your device
            </li>
            <li>
              <strong>Ollama:</strong> free, runs on your computer, data stays local
            </li>
            <li>
              <strong>Gemini / cloud APIs:</strong> only the selected fields above are sent
            </li>
            <li>If AI fails, JobPulse falls back to local keyword rules automatically</li>
          </ul>
          {aiActive ? (
            <>
              <p className="settings-note">
                Active provider: {providerLabel(config.provider)} ({config.model || "no model set"})
              </p>
              {connected ? (
                <button
                  className="button secondary"
                  type="button"
                  disabled={syncing}
                  onClick={() =>
                    void (async () => {
                      setReclassifyMessage(null);
                      const summary = await reclassifyWithAi();
                      if (summary) {
                        setReclassifyMessage(
                          `Re-classified ${summary.total} email(s): ${summary.aiUsed} with AI, ${summary.localFallback} used local fallback.`,
                        );
                      }
                    })()
                  }
                >
                  {syncing ? "Re-classifying..." : "Re-classify imported emails"}
                </button>
              ) : (
                <p className="settings-note">Connect Gmail first, then re-classify imported emails here.</p>
              )}
              {reclassifyMessage ? <p className="settings-note">{reclassifyMessage}</p> : null}
            </>
          ) : (
            <p className="settings-note">AI is currently disabled. Local rules are active.</p>
          )}
        </div>
      </section>

      {message ? <div className="card success-state">{message}</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}
    </div>
  );
}
