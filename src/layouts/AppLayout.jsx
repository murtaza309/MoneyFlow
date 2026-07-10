import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Tags,
  WalletCards,
  X,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import logo from "../assets/logo.png";

import "../styles/app-layout.css";


function AppLayout() {
  const {
    currentUser,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =========================================================
     MOBILE MORE MENU
     ========================================================= */

  const [
    showMobileMoreMenu,
    setShowMobileMoreMenu,
  ] = useState(false);


  /* =========================================================
     DESKTOP NAVIGATION
     ========================================================= */

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
      label: "Categories",
      path: "/categories",
      icon: Tags,
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


  /* =========================================================
     USER DETAILS
     ========================================================= */

  const displayName =
    currentUser?.displayName?.trim() ||
    "MoneyFlow User";


  const userInitial =
    currentUser?.displayName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||

    currentUser?.email
      ?.charAt(0)
      ?.toUpperCase() ||

    "U";


  /* =========================================================
     IS MORE ACTIVE
     ========================================================= */

  const isMoreActive =
    location.pathname === "/reports" ||
    location.pathname === "/settings";


  /* =========================================================
     CLOSE MORE MENU WHEN ROUTE CHANGES
     ========================================================= */

  useEffect(() => {

    setShowMobileMoreMenu(false);

  }, [location.pathname]);


  /* =========================================================
     OPEN MORE DESTINATION
     ========================================================= */

  const handleMobileMoreNavigation = (
    path
  ) => {

    setShowMobileMoreMenu(false);

    navigate(path);

  };


  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = async () => {

    try {

      await logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

  };


  return (

    <div className="app-shell">


      {/* =====================================================
          DESKTOP SIDEBAR
          ===================================================== */}

      <aside className="app-sidebar">


        {/* BRAND */}

        <div className="sidebar-brand">

          <img
            src={logo}
            alt="MoneyFlow"
            className="sidebar-full-logo"
          />

        </div>


        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <div className="sidebar-nav-label">
            Workspace
          </div>


          {navItems.map(
            (item) => {

              const Icon =
                item.icon;


              return (

                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({
                    isActive,
                  }) =>
                    `sidebar-nav-item ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >

                  <Icon
                    size={20}
                    strokeWidth={2}
                  />


                  <span>
                    {item.label}
                  </span>

                </NavLink>

              );

            }
          )}

        </nav>


        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">


          {/* USER */}

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">

              {userInitial}

            </div>


            <div className="sidebar-user-details">

              <strong>
                {displayName}
              </strong>


              <span>
                {currentUser?.email}
              </span>

            </div>

          </div>


          {/* LOGOUT */}

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >

            <LogOut
              size={18}
              strokeWidth={2}
            />


            <span>
              Sign out
            </span>

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="app-main">

        <Outlet />

      </main>


      {/* =====================================================
          MOBILE MORE BACKDROP
          ===================================================== */}

      {showMobileMoreMenu && (

        <button
          type="button"
          className="mobile-more-backdrop"
          onClick={() =>
            setShowMobileMoreMenu(false)
          }
          aria-label="Close more menu"
        />

      )}


      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <nav className="mobile-bottom-nav">


        {/* HOME */}

        <NavLink
          to="/dashboard"
          className={({
            isActive,
          }) =>
            `mobile-nav-item ${
              isActive
                ? "active"
                : ""
            }`
          }
        >

          <LayoutDashboard
            size={21}
            strokeWidth={2}
          />


          <span>
            Home
          </span>

        </NavLink>


        {/* TRANSACTIONS */}

        <NavLink
          to="/transactions"
          className={({
            isActive,
          }) =>
            `mobile-nav-item ${
              isActive
                ? "active"
                : ""
            }`
          }
        >

          <ArrowLeftRight
            size={21}
            strokeWidth={2}
          />


          <span>
            Transactions
          </span>

        </NavLink>


        {/* CENTRAL ADD BUTTON */}

        <NavLink
          to="/transactions/new"
          className="mobile-add-nav"
          aria-label="Add transaction"
        >

          <span className="mobile-add-button">

            <Plus
              size={26}
              strokeWidth={2.4}
            />

          </span>


          <span className="mobile-nav-label">
            Add
          </span>

        </NavLink>


        {/* CATEGORIES */}

        <NavLink
          to="/categories"
          className={({
            isActive,
          }) =>
            `mobile-nav-item ${
              isActive
                ? "active"
                : ""
            }`
          }
        >

          <Tags
            size={21}
            strokeWidth={2}
          />


          <span>
            Categories
          </span>

        </NavLink>


        {/* =================================================
            MORE
            ================================================= */}

        <div className="mobile-more-wrapper">


          {/* FLOATING MORE MENU */}

          {showMobileMoreMenu && (

            <div
              className="mobile-more-menu"
              role="menu"
            >


              {/* MENU HEADER */}

              <div className="mobile-more-menu-header">

                <span>
                  More
                </span>


                <button
                  type="button"
                  onClick={() =>
                    setShowMobileMoreMenu(false)
                  }
                  aria-label="Close more menu"
                >

                  <X
                    size={15}
                    strokeWidth={2.2}
                  />

                </button>

              </div>


              {/* REPORTS */}

              <button
                type="button"
                className={
                  `mobile-more-menu-item ${
                    location.pathname ===
                    "/reports"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  handleMobileMoreNavigation(
                    "/reports"
                  )
                }
                role="menuitem"
              >

                <span className="mobile-more-menu-icon reports">

                  <BarChart3
                    size={18}
                    strokeWidth={2.1}
                  />

                </span>


                <span className="mobile-more-menu-text">

                  <strong>
                    Reports
                  </strong>


                  <small>
                    Financial insights
                  </small>

                </span>

              </button>


              {/* SETTINGS */}

              <button
                type="button"
                className={
                  `mobile-more-menu-item ${
                    location.pathname ===
                    "/settings"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  handleMobileMoreNavigation(
                    "/settings"
                  )
                }
                role="menuitem"
              >

                <span className="mobile-more-menu-icon settings">

                  <Settings
                    size={18}
                    strokeWidth={2.1}
                  />

                </span>


                <span className="mobile-more-menu-text">

                  <strong>
                    Settings
                  </strong>


                  <small>
                    Preferences & account
                  </small>

                </span>

              </button>

            </div>

          )}


          {/* MORE BUTTON */}

          <button
            type="button"
            className={
              `mobile-nav-item mobile-more-button ${
                isMoreActive ||
                showMobileMoreMenu
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setShowMobileMoreMenu(
                (current) =>
                  !current
              )
            }
            aria-expanded={
              showMobileMoreMenu
            }
            aria-haspopup="menu"
          >

            <Settings
              size={21}
              strokeWidth={2}
            />


            <span>
              More
            </span>

          </button>

        </div>

      </nav>

    </div>

  );

}


export default AppLayout;