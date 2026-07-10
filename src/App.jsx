import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import {
  useAuth,
} from "./context/AuthContext";

import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

function ProtectedRoute({
  children,
}) {
  const {
    currentUser,
    authLoading,
  } = useAuth();


  if (authLoading) {
    return (
      <div>
        Loading MoneyFlow...
      </div>
    );
  }


  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
}


/* =========================================================
   PUBLIC ROUTE
   ========================================================= */

function PublicRoute({
  children,
}) {
  const {
    currentUser,
    authLoading,
  } = useAuth();


  if (authLoading) {
    return (
      <div>
        Loading MoneyFlow...
      </div>
    );
  }


  if (currentUser) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  return children;
}


/* =========================================================
   APP
   ========================================================= */

function App() {
  return (

    <Routes>


      {/* =====================================================
          PUBLIC ROUTES
          ===================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />


      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />


      {/* =====================================================
          PROTECTED APP ROUTES
          ===================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />


        <Route
          path="/transactions"
          element={
            <Transactions />
          }
        />


        <Route
          path="/transactions/new"
          element={
            <AddTransaction />
          }
        />


        <Route
          path="/categories"
          element={
            <Categories />
          }
        />


        <Route
          path="/reports"
          element={
            <Reports />
          }
        />


        <Route
          path="/settings"
          element={
            <Settings />
          }
        />

      </Route>


      {/* =====================================================
          REDIRECTS
          ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>

  );
}


export default App;