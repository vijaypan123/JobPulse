import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ApplicationsProvider } from "./context/ApplicationsContext";
import { Alerts } from "./routes/Alerts";
import { Applications } from "./routes/Applications";
import { Dashboard } from "./routes/Dashboard";
import { Deadlines } from "./routes/Deadlines";
import { Emails } from "./routes/Emails";
import { Settings } from "./routes/Settings";

function App() {
  return (
    <ApplicationsProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ApplicationsProvider>
  );
}

export default App;
