import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ApplicationsProvider } from "./context/ApplicationsContext";
import { GmailProvider } from "./context/GmailContext";
import { Alerts } from "./routes/Alerts";
import { Applications } from "./routes/Applications";
import { Dashboard } from "./routes/Dashboard";
import { Deadlines } from "./routes/Deadlines";
import { Emails } from "./routes/Emails";
import { OAuthGoogleCallback } from "./routes/OAuthGoogleCallback";
import { Settings } from "./routes/Settings";
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ApplicationsProvider>
      <GmailProvider>
        <Routes>
          <Route path="/oauth/google/callback" element={<OAuthGoogleCallback />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </GmailProvider>
    </ApplicationsProvider>
  );
}

export default App;
