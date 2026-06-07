import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/applications", label: "Applications" },
  { to: "/emails", label: "Emails" },
  { to: "/alerts", label: "Alerts" },
  { to: "/deadlines", label: "Deadlines" },
  { to: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>JobPulse</h1>
        <p>Private job search dashboard</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Local-first · AI optional</p>
      </div>
    </aside>
  );
}
