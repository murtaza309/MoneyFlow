import "../styles/login.css";
import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import "../styles/login.css";


function Login() {
  const navigate = useNavigate();

  const {
    login,
  } = useAuth();


  /* =========================================================
     FORM STATE
     ========================================================= */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  /* =========================================================
     UI STATE
     ========================================================= */

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  /* =========================================================
     LOGIN
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");


    const cleanEmail =
      email.trim();


    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }


    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }


    setLoading(true);


    try {
      await login(
        cleanEmail,
        password
      );


      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

    } catch (err) {
      console.error(
        "Login error:",
        err
      );


      switch (err.code) {

        case "auth/invalid-email":

          setError(
            "Please enter a valid email address."
          );

          break;


        case "auth/too-many-requests":

          setError(
            "Too many unsuccessful login attempts. Please try again later."
          );

          break;


        case "auth/user-disabled":

          setError(
            "This account has been disabled."
          );

          break;


        case "auth/invalid-credential":

          setError(
            "Incorrect email or password."
          );

          break;


        default:

          setError(
            "Unable to sign in. Please try again."
          );

      }

    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     FIELD CHANGES
     ========================================================= */

  const handleEmailChange = (
    event
  ) => {

    setEmail(
      event.target.value
    );


    if (error) {
      setError("");
    }
  };


  const handlePasswordChange = (
    event
  ) => {

    setPassword(
      event.target.value
    );


    if (error) {
      setError("");
    }
  };


  return (

    <div className="moneyflow-login-page">


      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <section className="moneyflow-login-showcase">


        {/* DECORATIVE BACKGROUND */}

        <div className="moneyflow-login-orb orb-one" />

        <div className="moneyflow-login-orb orb-two" />

        <div className="moneyflow-login-grid-pattern" />


        {/* BRAND */}

        <div className="moneyflow-login-showcase-brand">

          <div className="moneyflow-login-brand-mark">

            <Wallet
              size={24}
              strokeWidth={2.3}
            />

          </div>


          <div>

            <strong>
              MoneyFlow
            </strong>

            <span>
              Smart financial management
            </span>

          </div>

        </div>


        {/* HERO CONTENT */}

        <div className="moneyflow-login-showcase-content">

          <div className="moneyflow-login-badge">

            <Sparkles
              size={14}
              strokeWidth={2.2}
            />

            Your money. Clearly organised.

          </div>


          <h1>
            Understand every
            <span>
              penny moving in and out.
            </span>
          </h1>


          <p>
            Track transactions, organise everything into your
            own categories, monitor outstanding balances and
            generate clear financial reports from one place.
          </p>


          {/* FEATURE POINTS */}

          <div className="moneyflow-login-feature-list">

            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Unlimited flexible categories
              </span>

            </div>


            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Money in, money out and outstanding balances
              </span>

            </div>


            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Filtered financial reports and exports
              </span>

            </div>

          </div>

        </div>


        {/* FINANCIAL PREVIEW */}

        <div className="moneyflow-login-preview-card">

          <div className="moneyflow-login-preview-top">

            <div>

              <span>
                Financial overview
              </span>

              <strong>
                Your money at a glance
              </strong>

            </div>


            <div className="moneyflow-login-preview-icon">

              <TrendingUp
                size={19}
                strokeWidth={2.2}
              />

            </div>

          </div>


          <div className="moneyflow-login-preview-stats">


            <div>

              <span className="moneyflow-login-stat-icon income">

                <ArrowDownLeft
                  size={16}
                  strokeWidth={2.3}
                />

              </span>


              <div>

                <small>
                  Money In
                </small>

                <strong>
                  £12,480
                </strong>

              </div>

            </div>


            <div>

              <span className="moneyflow-login-stat-icon expense">

                <ArrowUpRight
                  size={16}
                  strokeWidth={2.3}
                />

              </span>


              <div>

                <small>
                  Money Out
                </small>

                <strong>
                  £7,260
                </strong>

              </div>

            </div>

          </div>


          <div className="moneyflow-login-preview-balance">

            <span>
              Net position
            </span>

            <strong>
              +£5,220.00
            </strong>

          </div>

        </div>


        {/* FOOTER */}

        <div className="moneyflow-login-showcase-footer">

          <ShieldCheck
            size={16}
            strokeWidth={2.2}
          />

          Secure access to your MoneyFlow account

        </div>

      </section>


      {/* =====================================================
          RIGHT LOGIN SIDE
          ===================================================== */}

      <main className="moneyflow-login-main">

        <div className="moneyflow-login-mobile-brand">

          <div className="moneyflow-login-brand-mark">

            <Wallet
              size={22}
              strokeWidth={2.3}
            />

          </div>


          <div>

            <strong>
              MoneyFlow
            </strong>

            <span>
              Smart financial management
            </span>

          </div>

        </div>


        <div className="moneyflow-login-card">


          {/* CARD HEADING */}

          <div className="moneyflow-login-heading">

            <span className="moneyflow-login-heading-icon">

              <LockKeyhole
                size={22}
                strokeWidth={2.2}
              />

            </span>


            <h2>
              Welcome back
            </h2>


            <p>
              Sign in to continue managing your transactions,
              categories, balances and financial reports.
            </p>

          </div>


          {/* ERROR */}

          {error && (

            <div
              className="moneyflow-login-error"
              role="alert"
            >

              <span className="moneyflow-login-error-icon">
                !
              </span>


              <p>
                {error}
              </p>

            </div>

          )}


          {/* FORM */}

          <form
            className="moneyflow-login-form"
            onSubmit={handleSubmit}
          >


            {/* EMAIL */}

            <div className="moneyflow-login-field">

              <label htmlFor="login-email">
                Email address
              </label>


              <div className="moneyflow-login-input-wrap">

                <Mail
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  required
                  autoFocus
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="moneyflow-login-field">

              <label htmlFor="login-password">
                Password
              </label>


              <div className="moneyflow-login-input-wrap">

                <LockKeyhole
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                />


                <button
                  type="button"
                  className="moneyflow-login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (

                    <EyeOff
                      size={18}
                      strokeWidth={2}
                    />

                  ) : (

                    <Eye
                      size={18}
                      strokeWidth={2}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="moneyflow-login-submit"
              disabled={loading}
            >

              {loading ? (

                <>

                  <Loader2
                    size={19}
                    strokeWidth={2.2}
                    className="moneyflow-login-spinner"
                  />

                  Signing you in...

                </>

              ) : (

                <>

                  Sign in to MoneyFlow

                  <ArrowRight
                    size={19}
                    strokeWidth={2.3}
                  />

                </>

              )}

            </button>

          </form>
          {/* =========================================================
    SIGN UP LINK
    ========================================================= */}

<div className="moneyflow-login-signup">

  <span>
    New to MoneyFlow?
  </span>

  <button
    type="button"
    onClick={() =>
      navigate("/register")
    }
    disabled={loading}
  >
    Create an account
  </button>

</div>


          {/* SECURITY NOTE */}

          <div className="moneyflow-login-security-note">

            <ShieldCheck
              size={17}
              strokeWidth={2.2}
            />


            <span>
              Your account is protected with secure Firebase
              authentication.
            </span>

          </div>

        </div>


        {/* COPYRIGHT */}

        <p className="moneyflow-login-copyright">
          © {new Date().getFullYear()} MoneyFlow. Smart money
          management made simple.
        </p>

      </main>

    </div>

  );
}


export default Login;