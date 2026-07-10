import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  ArrowDownLeft,
  ArrowLeft,
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
  UserRound,
  Wallet,
} from "lucide-react";

import {
  updateProfile,
} from "firebase/auth";

import {
  useAuth,
} from "../context/AuthContext";

import {
  saveSettingsSection,
} from "../services/settingsService";

import "../styles/login.css";


function Register() {
  const navigate = useNavigate();

  const {
    register,
  } = useAuth();


  /* =========================================================
     FORM STATE
     ========================================================= */

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  /* =========================================================
     PASSWORD VISIBILITY
     ========================================================= */

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
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
     PASSWORD VALIDATION
     ========================================================= */

  const passwordChecks = {
    minimumLength:
      password.length >= 8,

    hasUppercase:
      /[A-Z]/.test(password),

    hasLowercase:
      /[a-z]/.test(password),

    hasNumber:
      /[0-9]/.test(password),

    matches:
      password.length > 0 &&
      password === confirmPassword,
  };


  const passwordIsValid =
    passwordChecks.minimumLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber;


  /* =========================================================
     CLEAR ERROR
     ========================================================= */

  const clearError = () => {
    if (error) {
      setError("");
    }
  };


  /* =========================================================
     REGISTER
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");


    const cleanName =
      fullName
        .trim()
        .replace(/\s+/g, " ");


    const cleanEmail =
      email.trim();


    /* -------------------------------------------------------
       VALIDATE NAME
       ------------------------------------------------------- */

    if (!cleanName) {
      setError(
        "Please enter your full name."
      );

      return;
    }


    if (cleanName.length < 2) {
      setError(
        "Please enter a valid full name."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE EMAIL
       ------------------------------------------------------- */

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE PASSWORD
       ------------------------------------------------------- */

    if (!password) {
      setError(
        "Please enter a password."
      );

      return;
    }


    if (!passwordIsValid) {
      setError(
        "Your password must be at least 8 characters and include uppercase, lowercase and a number."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE CONFIRM PASSWORD
       ------------------------------------------------------- */

    if (!confirmPassword) {
      setError(
        "Please confirm your password."
      );

      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "The passwords do not match."
      );

      return;
    }


    /* -------------------------------------------------------
       CREATE FIREBASE ACCOUNT
       ------------------------------------------------------- */

    setLoading(true);


    try {

      const userCredential =
        await register(
          cleanEmail,
          password
        );


      /* -----------------------------------------------------
         SAVE NAME TO FIREBASE AUTH PROFILE
         ----------------------------------------------------- */

      await updateProfile(
        userCredential.user,
        {
          displayName:
            cleanName,
        }
      );


      /* -----------------------------------------------------
         SAVE NAME TO MONEYFLOW SETTINGS
         ----------------------------------------------------- */

      await saveSettingsSection(
        userCredential.user.uid,
        "profile",
        {
          displayName:
            cleanName,
        }
      );


      /* -----------------------------------------------------
         GO TO DASHBOARD
         ----------------------------------------------------- */

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

    } catch (err) {

      console.error(
        "Registration error:",
        err
      );


      switch (err.code) {

        case "auth/email-already-in-use":

          setError(
            "An account already exists with this email address."
          );

          break;


        case "auth/invalid-email":

          setError(
            "Please enter a valid email address."
          );

          break;


        case "auth/weak-password":

          setError(
            "Your password is too weak. Please choose a stronger password."
          );

          break;


        case "auth/operation-not-allowed":

          setError(
            "Account registration is currently unavailable."
          );

          break;


        case "auth/too-many-requests":

          setError(
            "Too many attempts. Please wait and try again later."
          );

          break;


        default:

          setError(
            "Unable to create your account. Please try again."
          );

      }

    } finally {

      setLoading(false);

    }
  };


  return (

    <div className="moneyflow-login-page moneyflow-register-page">


      {/* =====================================================
          LEFT SHOWCASE PANEL
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

            Start organising your money today

          </div>


          <h1>
            One place for every

            <span>
              transaction and category.
            </span>
          </h1>


          <p>
            Create your MoneyFlow account and take control of
            money in, money out, outstanding balances, custom
            categories and financial reports.
          </p>


          {/* FEATURE POINTS */}

          <div className="moneyflow-login-feature-list">

            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Create unlimited custom categories
              </span>

            </div>


            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Track paid, open and partially settled transactions
              </span>

            </div>


            <div>

              <CheckCircle2
                size={17}
                strokeWidth={2.2}
              />

              <span>
                Generate filtered financial reports and exports
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
                Everything organised clearly
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

          Secure account creation with Firebase authentication

        </div>

      </section>


      {/* =====================================================
          RIGHT REGISTER SIDE
          ===================================================== */}

      <main className="moneyflow-login-main moneyflow-register-main">


        {/* MOBILE BRAND */}

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


        {/* REGISTER CARD */}

        <div className="moneyflow-login-card moneyflow-register-card">


          {/* BACK TO LOGIN */}

          <button
            type="button"
            className="moneyflow-register-back"
            onClick={() =>
              navigate("/login")
            }
            disabled={loading}
          >

            <ArrowLeft
              size={16}
              strokeWidth={2.2}
            />

            Back to sign in

          </button>


          {/* HEADING */}

          <div className="moneyflow-login-heading">

            <span className="moneyflow-login-heading-icon">

              <UserRound
                size={22}
                strokeWidth={2.2}
              />

            </span>


            <h2>
              Create your account
            </h2>


            <p>
              Create your secure MoneyFlow account and start
              organising your finances.
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
            className="moneyflow-login-form moneyflow-register-form"
            onSubmit={handleSubmit}
          >


            {/* FULL NAME */}

            <div className="moneyflow-login-field">

              <label htmlFor="register-name">
                Full name
              </label>


              <div className="moneyflow-login-input-wrap">

                <UserRound
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => {

                    setFullName(
                      event.target.value
                    );

                    clearError();

                  }}
                  disabled={loading}
                  required
                  autoFocus
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="moneyflow-login-field">

              <label htmlFor="register-email">
                Email address
              </label>


              <div className="moneyflow-login-input-wrap">

                <Mail
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {

                    setEmail(
                      event.target.value
                    );

                    clearError();

                  }}
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="moneyflow-login-field">

              <label htmlFor="register-password">
                Create password
              </label>


              <div className="moneyflow-login-input-wrap">

                <LockKeyhole
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {

                    setPassword(
                      event.target.value
                    );

                    clearError();

                  }}
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


            {/* PASSWORD REQUIREMENTS */}

            {password && (

              <div className="moneyflow-password-requirements">

                <span
                  className={
                    passwordChecks.minimumLength
                      ? "valid"
                      : ""
                  }
                >

                  <CheckCircle2
                    size={13}
                    strokeWidth={2.2}
                  />

                  8+ characters

                </span>


                <span
                  className={
                    passwordChecks.hasUppercase
                      ? "valid"
                      : ""
                  }
                >

                  <CheckCircle2
                    size={13}
                    strokeWidth={2.2}
                  />

                  Uppercase

                </span>


                <span
                  className={
                    passwordChecks.hasLowercase
                      ? "valid"
                      : ""
                  }
                >

                  <CheckCircle2
                    size={13}
                    strokeWidth={2.2}
                  />

                  Lowercase

                </span>


                <span
                  className={
                    passwordChecks.hasNumber
                      ? "valid"
                      : ""
                  }
                >

                  <CheckCircle2
                    size={13}
                    strokeWidth={2.2}
                  />

                  Number

                </span>

              </div>

            )}


            {/* CONFIRM PASSWORD */}

            <div className="moneyflow-login-field">

              <label htmlFor="register-confirm-password">
                Confirm password
              </label>


              <div className="moneyflow-login-input-wrap">

                <LockKeyhole
                  size={18}
                  strokeWidth={2}
                />


                <input
                  id="register-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {

                    setConfirmPassword(
                      event.target.value
                    );

                    clearError();

                  }}
                  disabled={loading}
                  required
                />


                <button
                  type="button"
                  className="moneyflow-login-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showConfirmPassword ? (

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


              {confirmPassword && (

                <div
                  className={
                    `moneyflow-password-match ${
                      passwordChecks.matches
                        ? "valid"
                        : "invalid"
                    }`
                  }
                >

                  <CheckCircle2
                    size={13}
                    strokeWidth={2.2}
                  />


                  {passwordChecks.matches
                    ? "Passwords match"
                    : "Passwords do not match"}

                </div>

              )}

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

                  Creating your account...

                </>

              ) : (

                <>

                  Create MoneyFlow account

                  <ArrowRight
                    size={19}
                    strokeWidth={2.3}
                  />

                </>

              )}

            </button>

          </form>


          {/* SIGN IN LINK */}

          <div className="moneyflow-login-signup">

            <span>
              Already have an account?
            </span>


            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              disabled={loading}
            >
              Sign in
            </button>

          </div>


          {/* SECURITY NOTE */}

          <div className="moneyflow-login-security-note">

            <ShieldCheck
              size={17}
              strokeWidth={2.2}
            />


            <span>
              Secure account authentication powered by Firebase.
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


export default Register;