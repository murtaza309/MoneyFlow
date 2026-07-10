
import { NavLink, Outlet, useNavigate } from "react-router";
import "../styles/app-layout.css";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  WalletCards,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Transactions",
      path: "/transactions",
      icon: ArrowLeftRight,
    },
    
    
    
    {
      label: "Reports",
      path: "/reports",
      icon: BarChart3,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const mobileNavItems = [
    {
      label: "Home",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Transactions",
      path: "/transactions",
      icon: ArrowLeftRight,
    },
    {
      label: "Add",
      path: "/transactions/new",
      icon: Plus,
      isAddButton: true,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: BarChart3,
    },
    
    {
      label: "More",
      path: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <WalletCards size={24} strokeWidth={2.2} />
          </div>

          <div className="sidebar-brand-text">
            <h1>MoneyFlow</h1>
            <span>Smart money management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Workspace</div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} strokeWidth={2} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {currentUser?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="sidebar-user-details">
              <strong>MoneyFlow User</strong>
              <span>{currentUser?.email}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main app content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;

          if (item.isAddButton) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="mobile-add-nav"
                aria-label="Add transaction"
              >
                <span className="mobile-add-button">
                  <Icon size={26} strokeWidth={2.4} />
                </span>

                <span className="mobile-nav-label">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={21} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default AppLayout;