import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ApplicationsProvider } from "./context/ApplicationsContext";
import { AiSettingsProvider } from "./context/AiSettingsContext";
import { GmailProvider } from "./context/GmailContext";
import { Alerts } from "./routes/Alerts";
import { Applications } from "./routes/Applications";
import { Dashboard } from "./routes/Dashboard";
import { Deadlines } from "./routes/Deadlines";
import { Emails } from "./routes/Emails";
import { OAuthGoogleCallback } from "./routes/OAuthGoogleCallback";
import { Settings } from "./routes/Settings";
import { SettingsAi } from "./routes/SettingsAi";
import { SettingsEmail } from "./routes/SettingsEmail";

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/email" element={<SettingsEmail />} />
          <Route path="/settings/ai" element={<SettingsAi />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ApplicationsProvider>
      <AiSettingsProvider>
        <GmailProvider>
          <Routes>
            <Route path="/oauth/google/callback" element={<OAuthGoogleCallback />} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </GmailProvider>
      </AiSettingsProvider>
    </ApplicationsProvider>
  );
}

export default App;
