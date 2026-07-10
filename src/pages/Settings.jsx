import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Coins,
  Database,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MonitorCog,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  useAuth,
} from "../context/AuthContext";

import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  resetUserSettings,
  saveUserSettings,
} from "../services/settingsService";

import {
  deleteTransaction,
  getTransactions,
} from "../services/transactionService";

import "../styles/settings.css";


/* =========================================================
   CURRENCY OPTIONS
   ========================================================= */

const CURRENCY_OPTIONS = [
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    locale: "en-GB",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    locale: "en-US",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    locale: "en-IE",
  },
  {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "Rs",
    locale: "en-PK",
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    locale: "en-AE",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    locale: "en-CA",
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    locale: "en-AU",
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    locale: "en-IN",
  },
];


/* =========================================================
   PAYMENT METHODS
   ========================================================= */

const PAYMENT_METHODS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
  },
  {
    value: "direct_debit",
    label: "Direct debit",
  },
  {
    value: "standing_order",
    label: "Standing order",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "other",
    label: "Other",
  },
];


/* =========================================================
   SETTINGS PAGE
   ========================================================= */

function Settings() {
  const navigate = useNavigate();

  const {
    currentUser,
    logout,
  } = useAuth();


  /* =========================================================
     SETTINGS STATE
     ========================================================= */

  const [
    settings,
    setSettings,
  ] = useState(
    DEFAULT_USER_SETTINGS
  );


  /* =========================================================
     UI STATE
     ========================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [
    resetting,
    setResetting,
  ] = useState(false);

  const [
    deletingTransactions,
    setDeletingTransactions,
  ] = useState(false);

  const [
    sendingPasswordReset,
    setSendingPasswordReset,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =========================================================
     DELETE CONFIRMATION MODAL
     ========================================================= */

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");


  /* =========================================================
     RESET SETTINGS CONFIRMATION
     ========================================================= */

  const [
    resetModalOpen,
    setResetModalOpen,
  ] = useState(false);


  /* =========================================================
     LOAD SETTINGS
     ========================================================= */

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.uid) {
        return;
      }


      setLoading(true);

      setError("");


      try {
        const savedSettings =
          await getUserSettings(
            currentUser.uid
          );


        setSettings(
          savedSettings
        );

      } catch (err) {
        console.error(
          "Load settings error:",
          err
        );


        setError(
          "Unable to load your settings. Please refresh and try again."
        );

      } finally {
        setLoading(false);
      }
    };


    loadSettings();

  }, [currentUser?.uid]);


  /* =========================================================
     CURRENCY PREVIEW
     ========================================================= */

  const currencyPreview = useMemo(() => {
    const money =
      settings.money;


    try {
      const formatted =
        new Intl.NumberFormat(
          money.numberFormat ||
            "en-GB",

          {
            style: "currency",

            currency:
              money.currency ||
              "GBP",

            minimumFractionDigits:
              Number(
                money.decimalPlaces
              ),

            maximumFractionDigits:
              Number(
                money.decimalPlaces
              ),
          }
        ).format(
          1250.5
        );


      return formatted;

    } catch {
      return "£1,250.50";
    }

  }, [
    settings.money,
  ]);


  /* =========================================================
     UPDATE NESTED SETTING
     ========================================================= */

  const updateSetting = (
    section,
    field,
    value
  ) => {

    setSettings((current) => ({
      ...current,

      [section]: {
        ...current[section],

        [field]: value,
      },
    }));


    if (error) {
      setError("");
    }


    if (successMessage) {
      setSuccessMessage("");
    }
  };


  /* =========================================================
     HANDLE CURRENCY CHANGE
     ========================================================= */

  const handleCurrencyChange = (
    event
  ) => {

    const selectedCurrency =
      CURRENCY_OPTIONS.find(
        (currency) =>
          currency.code ===
          event.target.value
      );


    if (!selectedCurrency) {
      return;
    }


    setSettings((current) => ({
      ...current,

      money: {
        ...current.money,

        currency:
          selectedCurrency.code,

        currencySymbol:
          selectedCurrency.symbol,

        numberFormat:
          selectedCurrency.locale,
      },
    }));


    setError("");

    setSuccessMessage("");
  };


  /* =========================================================
     SAVE SETTINGS
     ========================================================= */

  const handleSaveSettings = async () => {
    if (!currentUser?.uid) {
      return;
    }


    setSaving(true);

    setError("");

    setSuccessMessage("");


    try {
      await saveUserSettings(
        currentUser.uid,
        settings
      );


      setSuccessMessage(
        "Your MoneyFlow settings have been saved successfully."
      );

    } catch (err) {
      console.error(
        "Save settings error:",
        err
      );


      setError(
        err.message ||
          "Unable to save your settings. Please try again."
      );

    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     PASSWORD RESET EMAIL
     ========================================================= */

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      setError(
        "No email address is available for this account."
      );

      return;
    }


    setSendingPasswordReset(true);

    setError("");

    setSuccessMessage("");


    try {
      await sendPasswordResetEmail(
        auth,
        currentUser.email
      );


      setSuccessMessage(
        `A password reset email has been sent to ${currentUser.email}.`
      );

    } catch (err) {
      console.error(
        "Password reset error:",
        err
      );


      setError(
        "Unable to send the password reset email. Please try again."
      );

    } finally {
      setSendingPasswordReset(false);
    }
  };


  /* =========================================================
     EXPORT ALL TRANSACTIONS AS CSV
     ========================================================= */

  const handleExportAllData = async () => {
    if (!currentUser?.uid) {
      return;
    }


    setExporting(true);

    setError("");

    setSuccessMessage("");


    try {
      const transactions =
        await getTransactions(
          currentUser.uid
        );


      if (
        transactions.length === 0
      ) {
        setError(
          "There are no transactions to export."
        );

        return;
      }


      const headers = [
        "Title",
        "Amount",
        "Direction",
        "Status",
        "Settled Amount",
        "Outstanding Amount",
        "Transaction Date",
        "Due Date",
        "Category",
        "Payment Method",
        "Description",
        "Private Notes",
      ];


      const escapeCsv = (
        value
      ) => {

        const text =
          String(
            value ?? ""
          );


        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      };


      const rows =
        transactions.map(
          (transaction) => [

            transaction.title,

            transaction.amount,

            transaction.direction,

            transaction.status,

            transaction.settledAmount,

            transaction.outstandingAmount,

            transaction.date,

            transaction.dueDate,

            transaction.categoryName,

            transaction.paymentMethod,

            transaction.description,

            transaction.notes,

          ].map(
            escapeCsv
          )
        );


      const csvContent = [
        headers.map(
          escapeCsv
        ),

        ...rows,
      ]
        .map(
          (row) =>
            row.join(",")
        )
        .join("\n");


      const blob =
        new Blob(
          [csvContent],

          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      const today =
        new Date()
          .toISOString()
          .split("T")[0];


      link.href = url;

      link.download =
        `moneyflow-all-transactions-${today}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );


      setSuccessMessage(
        `${transactions.length} transaction${
          transactions.length === 1
            ? ""
            : "s"
        } exported successfully.`
      );

    } catch (err) {
      console.error(
        "Export transactions error:",
        err
      );


      setError(
        "Unable to export your transaction data. Please try again."
      );

    } finally {
      setExporting(false);
    }
  };


  /* =========================================================
     RESET SETTINGS
     ========================================================= */

  const handleResetSettings = async () => {
    if (!currentUser?.uid) {
      return;
    }


    setResetting(true);

    setError("");

    setSuccessMessage("");


    try {
      const defaultSettings =
        await resetUserSettings(
          currentUser.uid
        );


      setSettings(
        defaultSettings
      );


      setResetModalOpen(false);


      setSuccessMessage(
        "All preferences have been restored to their default values."
      );

    } catch (err) {
      console.error(
        "Reset settings error:",
        err
      );


      setError(
        "Unable to reset your settings. Please try again."
      );

    } finally {
      setResetting(false);
    }
  };


  /* =========================================================
     DELETE ALL TRANSACTIONS
     ========================================================= */

  const handleDeleteAllTransactions =
    async () => {

      if (!currentUser?.uid) {
        return;
      }


      if (
        deleteConfirmation.trim()
          .toUpperCase() !==
        "DELETE ALL"
      ) {
        setError(
          'Type "DELETE ALL" exactly to confirm permanent deletion.'
        );

        return;
      }


      setDeletingTransactions(true);

      setError("");

      setSuccessMessage("");


      try {
        const transactions =
          await getTransactions(
            currentUser.uid
          );


        if (
          transactions.length === 0
        ) {
          setDeleteModalOpen(false);

          setDeleteConfirmation("");


          setSuccessMessage(
            "There are no transactions to delete."
          );

          return;
        }


        await Promise.all(
          transactions.map(
            (transaction) =>
              deleteTransaction(
                currentUser.uid,
                transaction.id
              )
          )
        );


        setDeleteModalOpen(false);

        setDeleteConfirmation("");


        setSuccessMessage(
          `${transactions.length} transaction${
            transactions.length === 1
              ? ""
              : "s"
          } permanently deleted.`
        );

      } catch (err) {
        console.error(
          "Delete all transactions error:",
          err
        );


        setError(
          "Unable to delete all transactions. Please try again."
        );

      } finally {
        setDeletingTransactions(false);
      }
    };


  /* =========================================================
     SIGN OUT
     ========================================================= */

  const handleSignOut = async () => {
    try {
      await logout();


      navigate(
        "/login",
        {
          replace: true,
        }
      );

    } catch (err) {
      console.error(
        "Sign out error:",
        err
      );


      setError(
        "Unable to sign out. Please try again."
      );
    }
  };


  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {
    return (

      <div className="settings-page">

        <section className="settings-loading">

          <Loader2
            size={32}
            strokeWidth={2}
            className="settings-spinner"
          />


          <p>
            Loading your MoneyFlow settings...
          </p>

        </section>

      </div>

    );
  }


  return (

    <div className="settings-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="settings-header">

        <div>

          <p className="settings-eyebrow">
            Preferences & account
          </p>


          <h1>
            Settings
          </h1>


          <p className="settings-description">
            Personalise MoneyFlow, configure transaction
            defaults, manage reporting preferences and control
            your financial data.
          </p>

        </div>


        <button
          type="button"
          className="settings-save-button"
          onClick={
            handleSaveSettings
          }
          disabled={saving}
        >

          {saving ? (

            <>

              <Loader2
                size={18}
                className="settings-spinner"
              />

              Saving...

            </>

          ) : (

            <>

              <Save
                size={18}
                strokeWidth={2.3}
              />

              Save settings

            </>

          )}

        </button>

      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (

        <div className="settings-message error">

          <AlertTriangle
            size={18}
            strokeWidth={2.2}
          />


          <span>
            {error}
          </span>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >

            <X size={16} />

          </button>

        </div>

      )}


      {successMessage && (

        <div className="settings-message success">

          <CheckCircle2
            size={18}
            strokeWidth={2.3}
          />


          <span>
            {successMessage}
          </span>


          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            aria-label="Dismiss message"
          >

            <X size={16} />

          </button>

        </div>

      )}


      {/* =====================================================
          ACCOUNT
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon account">

            <UserRound
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Account
            </h2>


            <p>
              Manage your MoneyFlow identity and account access.
            </p>

          </div>

        </div>


        <div className="settings-fields-grid">


          {/* DISPLAY NAME */}

          <div className="settings-field">

            <label htmlFor="settings-display-name">
              Display name
            </label>


            <input
              id="settings-display-name"
              type="text"
              placeholder="Enter your name"
              value={
                settings.profile
                  .displayName
              }
              onChange={(event) =>
                updateSetting(
                  "profile",
                  "displayName",
                  event.target.value
                )
              }
            />

          </div>


          {/* EMAIL */}

          <div className="settings-field">

            <label htmlFor="settings-email">
              Email address
            </label>


            <div className="settings-input-with-icon">

              <Mail
                size={17}
                strokeWidth={2}
              />


              <input
                id="settings-email"
                type="email"
                value={
                  currentUser?.email ||
                  ""
                }
                disabled
              />

            </div>

          </div>

        </div>


        <div className="settings-inline-actions">

          <button
            type="button"
            className="settings-secondary-button"
            onClick={
              handlePasswordReset
            }
            disabled={
              sendingPasswordReset
            }
          >

            {sendingPasswordReset ? (

              <Loader2
                size={17}
                className="settings-spinner"
              />

            ) : (

              <KeyRound
                size={17}
                strokeWidth={2.1}
              />

            )}


            Send password reset email

          </button>


          <button
            type="button"
            className="settings-secondary-button"
            onClick={
              handleSignOut
            }
          >

            <LogOut
              size={17}
              strokeWidth={2.1}
            />

            Sign out

          </button>

        </div>

      </section>


      {/* =====================================================
          MONEY PREFERENCES
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon money">

            <Coins
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Money preferences
            </h2>


            <p>
              Configure how currency and financial values are displayed.
            </p>

          </div>

        </div>


        <div className="settings-fields-grid">


          {/* CURRENCY */}

          <div className="settings-field">

            <label htmlFor="settings-currency">
              Currency
            </label>


            <select
              id="settings-currency"
              value={
                settings.money.currency
              }
              onChange={
                handleCurrencyChange
              }
            >

              {CURRENCY_OPTIONS.map(
                (currency) => (

                  <option
                    key={
                      currency.code
                    }
                    value={
                      currency.code
                    }
                  >
                    {currency.symbol}{" "}
                    {currency.code} —{" "}
                    {currency.name}
                  </option>

                )
              )}

            </select>

          </div>


          {/* CURRENCY POSITION */}

          <div className="settings-field">

            <label htmlFor="settings-currency-position">
              Currency position
            </label>


            <select
              id="settings-currency-position"
              value={
                settings.money
                  .currencyPosition
              }
              onChange={(event) =>
                updateSetting(
                  "money",
                  "currencyPosition",
                  event.target.value
                )
              }
            >

              <option value="before">
                Before amount — £100
              </option>

              <option value="after">
                After amount — 100 £
              </option>

            </select>

          </div>


          {/* DECIMALS */}

          <div className="settings-field">

            <label htmlFor="settings-decimals">
              Decimal places
            </label>


            <select
              id="settings-decimals"
              value={
                settings.money
                  .decimalPlaces
              }
              onChange={(event) =>
                updateSetting(
                  "money",
                  "decimalPlaces",
                  Number(
                    event.target.value
                  )
                )
              }
            >

              <option value={0}>
                0 decimals
              </option>

              <option value={2}>
                2 decimals
              </option>

            </select>

          </div>


          {/* PREVIEW */}

          <div className="settings-currency-preview">

            <span>
              Preview
            </span>


            <strong>
              {currencyPreview}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          TRANSACTION DEFAULTS
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon transactions">

            <ReceiptText
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Transaction defaults
            </h2>


            <p>
              Choose the options automatically selected when adding a transaction.
            </p>

          </div>

        </div>


        <div className="settings-fields-grid">


          {/* DEFAULT DIRECTION */}

          <div className="settings-field">

            <label htmlFor="default-direction">
              Default direction
            </label>


            <select
              id="default-direction"
              value={
                settings
                  .transactionDefaults
                  .direction
              }
              onChange={(event) =>
                updateSetting(
                  "transactionDefaults",
                  "direction",
                  event.target.value
                )
              }
            >

              <option value="out">
                Money Out
              </option>

              <option value="in">
                Money In
              </option>

            </select>

          </div>


          {/* DEFAULT STATUS */}

          <div className="settings-field">

            <label htmlFor="default-status">
              Default payment status
            </label>


            <select
              id="default-status"
              value={
                settings
                  .transactionDefaults
                  .status
              }
              onChange={(event) =>
                updateSetting(
                  "transactionDefaults",
                  "status",
                  event.target.value
                )
              }
            >

              <option value="cleared">
                Cleared
              </option>

              <option value="open">
                Open
              </option>

              <option value="partial">
                Partially settled
              </option>

            </select>

          </div>


          {/* DEFAULT PAYMENT METHOD */}

          <div className="settings-field full-width">

            <label htmlFor="default-payment-method">
              Default payment method
            </label>


            <select
              id="default-payment-method"
              value={
                settings
                  .transactionDefaults
                  .paymentMethod
              }
              onChange={(event) =>
                updateSetting(
                  "transactionDefaults",
                  "paymentMethod",
                  event.target.value
                )
              }
            >

              {PAYMENT_METHODS.map(
                (method) => (

                  <option
                    key={
                      method.value
                    }
                    value={
                      method.value
                    }
                  >
                    {method.label}
                  </option>

                )
              )}

            </select>

          </div>

        </div>


        <div className="settings-toggle-list">


          <label className="settings-toggle-row">

            <div>

              <strong>
                Require a category
              </strong>


              <span>
                Prevent transactions from being saved without a category.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings
                    .transactionDefaults
                    .requireCategory
                }
                onChange={(event) =>
                  updateSetting(
                    "transactionDefaults",
                    "requireCategory",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Remember last category
              </strong>


              <span>
                Preselect the most recently used category when adding the next transaction.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings
                    .transactionDefaults
                    .rememberLastCategory
                }
                onChange={(event) =>
                  updateSetting(
                    "transactionDefaults",
                    "rememberLastCategory",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>

        </div>

      </section>


      {/* =====================================================
          DISPLAY PREFERENCES
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon display">

            <MonitorCog
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Display preferences
            </h2>


            <p>
              Control how information is presented throughout MoneyFlow.
            </p>

          </div>

        </div>


        <div className="settings-fields-grid">


          {/* WEEK START */}

          <div className="settings-field">

            <label htmlFor="week-start">
              Week starts on
            </label>


            <select
              id="week-start"
              value={
                settings.display
                  .weekStartsOn
              }
              onChange={(event) =>
                updateSetting(
                  "display",
                  "weekStartsOn",
                  event.target.value
                )
              }
            >

              <option value="monday">
                Monday
              </option>

              <option value="sunday">
                Sunday
              </option>

            </select>

          </div>


          {/* RECENT TRANSACTIONS */}

          <div className="settings-field">

            <label htmlFor="recent-count">
              Dashboard recent transactions
            </label>


            <select
              id="recent-count"
              value={
                settings.display
                  .recentTransactionsCount
              }
              onChange={(event) =>
                updateSetting(
                  "display",
                  "recentTransactionsCount",
                  Number(
                    event.target.value
                  )
                )
              }
            >

              <option value={5}>
                5 transactions
              </option>

              <option value={10}>
                10 transactions
              </option>

              <option value={20}>
                20 transactions
              </option>

            </select>

          </div>

        </div>


        <div className="settings-toggle-list">


          <label className="settings-toggle-row">

            <div>

              <strong>
                Show inactive categories
              </strong>


              <span>
                Include inactive categories in applicable lists and selectors.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.display
                    .showInactiveCategories
                }
                onChange={(event) =>
                  updateSetting(
                    "display",
                    "showInactiveCategories",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Compact transaction cards
              </strong>


              <span>
                Use a denser layout when displaying transaction lists.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.display
                    .compactTransactionCards
                }
                onChange={(event) =>
                  updateSetting(
                    "display",
                    "compactTransactionCards",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Show transaction descriptions
              </strong>


              <span>
                Display descriptions directly on transaction cards.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.display
                    .showTransactionDescriptions
                }
                onChange={(event) =>
                  updateSetting(
                    "display",
                    "showTransactionDescriptions",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Show payment methods
              </strong>


              <span>
                Display payment-method information on transaction cards.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.display
                    .showPaymentMethods
                }
                onChange={(event) =>
                  updateSetting(
                    "display",
                    "showPaymentMethods",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Show due dates
              </strong>


              <span>
                Display due dates wherever they are relevant.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.display
                    .showDueDates
                }
                onChange={(event) =>
                  updateSetting(
                    "display",
                    "showDueDates",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>

        </div>

      </section>


      {/* =====================================================
          REPORT DEFAULTS
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon reports">

            <BarChart3
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Report defaults
            </h2>


            <p>
              Choose which filters Reports should use when first opened.
            </p>

          </div>

        </div>


        <div className="settings-fields-grid">


          <div className="settings-field">

            <label htmlFor="report-default-period">
              Default period
            </label>


            <select
              id="report-default-period"
              value={
                settings.reports
                  .defaultPeriod
              }
              onChange={(event) =>
                updateSetting(
                  "reports",
                  "defaultPeriod",
                  event.target.value
                )
              }
            >

              <option value="all">
                All time
              </option>

              <option value="today">
                Today
              </option>

              <option value="week">
                This week
              </option>

              <option value="month">
                This month
              </option>

              <option value="year">
                This year
              </option>

            </select>

          </div>


          <div className="settings-field">

            <label htmlFor="report-default-direction">
              Default direction
            </label>


            <select
              id="report-default-direction"
              value={
                settings.reports
                  .defaultDirection
              }
              onChange={(event) =>
                updateSetting(
                  "reports",
                  "defaultDirection",
                  event.target.value
                )
              }
            >

              <option value="all">
                Money In & Out
              </option>

              <option value="in">
                Money In only
              </option>

              <option value="out">
                Money Out only
              </option>

            </select>

          </div>


          <div className="settings-field">

            <label htmlFor="report-default-status">
              Default status
            </label>


            <select
              id="report-default-status"
              value={
                settings.reports
                  .defaultStatus
              }
              onChange={(event) =>
                updateSetting(
                  "reports",
                  "defaultStatus",
                  event.target.value
                )
              }
            >

              <option value="all">
                All statuses
              </option>

              <option value="cleared">
                Cleared
              </option>

              <option value="open">
                Open
              </option>

              <option value="partial">
                Partially settled
              </option>

            </select>

          </div>

        </div>


        <div className="settings-toggle-list">

          <label className="settings-toggle-row">

            <div>

              <strong>
                Include zero-value categories
              </strong>


              <span>
                Show categories in reports even when they have no matching transactions.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.reports
                    .includeZeroValueCategories
                }
                onChange={(event) =>
                  updateSetting(
                    "reports",
                    "includeZeroValueCategories",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>

        </div>

      </section>


      {/* =====================================================
          REMINDERS
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon reminders">

            <BellRing
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Reminder preferences
            </h2>


            <p>
              Configure how due and overdue transactions should be highlighted.
            </p>

          </div>

        </div>


        <div className="settings-toggle-list">


          <label className="settings-toggle-row">

            <div>

              <strong>
                Due-date reminders
              </strong>


              <span>
                Highlight transactions approaching their due date.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.notifications
                    .dueDateReminders
                }
                onChange={(event) =>
                  updateSetting(
                    "notifications",
                    "dueDateReminders",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>


          <label className="settings-toggle-row">

            <div>

              <strong>
                Overdue reminders
              </strong>


              <span>
                Highlight open transactions that are past their due date.
              </span>

            </div>


            <span className="settings-toggle-control">

              <input
                type="checkbox"
                checked={
                  settings.notifications
                    .overdueReminders
                }
                onChange={(event) =>
                  updateSetting(
                    "notifications",
                    "overdueReminders",
                    event.target.checked
                  )
                }
              />

              <span className="settings-toggle-slider" />

            </span>

          </label>

        </div>


        <div className="settings-fields-grid settings-reminder-days-grid">

          <div className="settings-field">

            <label htmlFor="reminder-days-before">
              Remind before due date
            </label>


            <div className="settings-input-with-icon">

              <CalendarDays
                size={17}
                strokeWidth={2}
              />


              <input
                id="reminder-days-before"
                type="number"
                min="0"
                max="30"
                value={
                  settings.notifications
                    .reminderDaysBefore
                }
                onChange={(event) =>
                  updateSetting(
                    "notifications",
                    "reminderDaysBefore",
                    Math.max(
                      0,
                      Number(
                        event.target.value
                      ) || 0
                    )
                  )
                }
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          DATA & EXPORT
          ===================================================== */}

      <section className="settings-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon data">

            <Database
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Data & export
            </h2>


            <p>
              Download and protect your MoneyFlow transaction history.
            </p>

          </div>

        </div>


        <div className="settings-action-list">


          <div className="settings-action-row">

            <div>

              <strong>
                Export all transactions
              </strong>


              <span>
                Download your complete transaction history as a CSV file.
              </span>

            </div>


            <button
              type="button"
              className="settings-secondary-button"
              onClick={
                handleExportAllData
              }
              disabled={exporting}
            >

              {exporting ? (

                <Loader2
                  size={17}
                  className="settings-spinner"
                />

              ) : (

                <Download
                  size={17}
                  strokeWidth={2.1}
                />

              )}


              Export CSV

            </button>

          </div>


          <div className="settings-action-row">

            <div>

              <strong>
                Reset preferences
              </strong>


              <span>
                Restore all MoneyFlow preferences to their original defaults without deleting financial data.
              </span>

            </div>


            <button
              type="button"
              className="settings-secondary-button"
              onClick={() => {
                setResetModalOpen(true);

                setError("");

                setSuccessMessage("");
              }}
            >

              <RotateCcw
                size={17}
                strokeWidth={2.1}
              />

              Reset settings

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          DANGER ZONE
          ===================================================== */}

      <section className="settings-card settings-danger-card">

        <div className="settings-card-heading">

          <div className="settings-card-icon danger">

            <AlertTriangle
              size={21}
              strokeWidth={2.1}
            />

          </div>


          <div>

            <h2>
              Danger zone
            </h2>


            <p>
              Destructive actions are permanent and should be used carefully.
            </p>

          </div>

        </div>


        <div className="settings-action-list">


          <div className="settings-action-row danger">

            <div>

              <strong>
                Delete all transactions
              </strong>


              <span>
                Permanently remove every transaction from your MoneyFlow account. Categories and settings will remain.
              </span>

            </div>


            <button
              type="button"
              className="settings-danger-button"
              onClick={() => {
                setDeleteModalOpen(true);

                setDeleteConfirmation("");

                setError("");

                setSuccessMessage("");
              }}
            >

              <Trash2
                size={17}
                strokeWidth={2.1}
              />

              Delete transactions

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM SAVE BAR
          ===================================================== */}

      <div className="settings-bottom-actions">

        <button
          type="button"
          className="settings-save-button"
          onClick={
            handleSaveSettings
          }
          disabled={saving}
        >

          {saving ? (

            <>

              <Loader2
                size={18}
                className="settings-spinner"
              />

              Saving...

            </>

          ) : (

            <>

              <Save
                size={18}
                strokeWidth={2.3}
              />

              Save all settings

            </>

          )}

        </button>

      </div>


      {/* =====================================================
          RESET SETTINGS MODAL
          ===================================================== */}

      {resetModalOpen && (

        <div
          className="settings-modal-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget &&

              !resetting
            ) {
              setResetModalOpen(false);
            }

          }}
        >

          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="settings-modal-icon warning">

              <RefreshCw
                size={25}
                strokeWidth={2.1}
              />

            </div>


            <h2>
              Reset all preferences?
            </h2>


            <p>
              Currency, transaction defaults, display settings,
              report defaults and reminder preferences will all
              return to their original values. Your transactions
              and categories will not be deleted.
            </p>


            <div className="settings-modal-actions">

              <button
                type="button"
                className="settings-modal-cancel"
                onClick={() =>
                  setResetModalOpen(false)
                }
                disabled={resetting}
              >
                Cancel
              </button>


              <button
                type="button"
                className="settings-modal-confirm"
                onClick={
                  handleResetSettings
                }
                disabled={resetting}
              >

                {resetting ? (

                  <>

                    <Loader2
                      size={17}
                      className="settings-spinner"
                    />

                    Resetting...

                  </>

                ) : (

                  <>

                    <RotateCcw
                      size={17}
                      strokeWidth={2.1}
                    />

                    Reset preferences

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE ALL TRANSACTIONS MODAL
          ===================================================== */}

      {deleteModalOpen && (

        <div
          className="settings-modal-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget &&

              !deletingTransactions
            ) {
              setDeleteModalOpen(false);

              setDeleteConfirmation("");
            }

          }}
        >

          <div
            className="settings-modal danger"
            role="dialog"
            aria-modal="true"
          >

            <div className="settings-modal-icon danger">

              <Trash2
                size={25}
                strokeWidth={2.1}
              />

            </div>


            <h2>
              Permanently delete all transactions?
            </h2>


            <p>
              Every transaction will be permanently removed from
              your Dashboard, Reports and transaction history.
              This action cannot be undone.
            </p>


            <div className="settings-delete-confirmation">

              <label htmlFor="delete-all-confirmation">
                Type{" "}
                <strong>
                  DELETE ALL
                </strong>{" "}
                to confirm
              </label>


              <input
                id="delete-all-confirmation"
                type="text"
                placeholder="DELETE ALL"
                value={
                  deleteConfirmation
                }
                onChange={(event) =>
                  setDeleteConfirmation(
                    event.target.value
                  )
                }
                disabled={
                  deletingTransactions
                }
                autoComplete="off"
              />

            </div>


            <div className="settings-modal-actions">

              <button
                type="button"
                className="settings-modal-cancel"
                onClick={() => {

                  setDeleteModalOpen(false);

                  setDeleteConfirmation("");

                }}
                disabled={
                  deletingTransactions
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="settings-modal-delete"
                onClick={
                  handleDeleteAllTransactions
                }
                disabled={
                  deletingTransactions ||

                  deleteConfirmation
                    .trim()
                    .toUpperCase() !==
                    "DELETE ALL"
                }
              >

                {deletingTransactions ? (

                  <>

                    <Loader2
                      size={17}
                      className="settings-spinner"
                    />

                    Deleting...

                  </>

                ) : (

                  <>

                    <Trash2
                      size={17}
                      strokeWidth={2.1}
                    />

                    Delete everything

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}


export default Settings;