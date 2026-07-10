import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  Landmark,
  Loader2,
  Save,
  Tag,
  WalletCards,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCategories,
} from "../services/categoryService";

import {
  createTransaction,
} from "../services/transactionService";

import "../styles/add-transaction.css";


/* =========================================================
   LOCAL DATE HELPER
   ========================================================= */

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   DEFAULT FORM
   ========================================================= */

const DEFAULT_FORM = {
  title: "",

  amount: "",

  direction: "out",

  status: "cleared",

  settledAmount: "",

  date: getTodayDate(),

  categoryId: "",

  dueDate: "",

  paymentMethod: "",

  description: "",

  notes: "",
};


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
   ADD TRANSACTION
   ========================================================= */

function AddTransaction() {
  const navigate = useNavigate();

  const { currentUser } = useAuth();


  /* =========================================================
     FORM STATE
     ========================================================= */

  const [
    formData,
    setFormData,
  ] = useState(DEFAULT_FORM);


  /* =========================================================
     CATEGORIES
     ========================================================= */

  const [
    categories,
    setCategories,
  ] = useState([]);


  /* =========================================================
     UI STATE
     ========================================================= */

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true);

  const [
    saving,
    setSaving,
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
     LOAD CATEGORIES
     ========================================================= */

  useEffect(() => {
    const loadCategories = async () => {
      if (!currentUser?.uid) {
        return;
      }


      setLoadingOptions(true);

      setError("");


      try {
        const categoryList =
          await getCategories(
            currentUser.uid
          );


        setCategories(
          categoryList.filter(
            (category) =>
              category.isActive !== false
          )
        );

      } catch (err) {
        console.error(
          "Load categories error:",
          err
        );


        setError(
          "Unable to load your categories. Please refresh and try again."
        );

      } finally {
        setLoadingOptions(false);
      }
    };


    loadCategories();

  }, [currentUser?.uid]);


  /* =========================================================
     AVAILABLE CATEGORIES FOR CURRENT DIRECTION

     A category can be:
     - Money In
     - Money Out
     - Both

     Only compatible categories are displayed.
     ========================================================= */

  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) => {

        return (
          category.direction === "both" ||

          category.direction ===
            formData.direction
        );
      }
    );

  }, [
    categories,
    formData.direction,
  ]);


  /* =========================================================
     AMOUNT CALCULATIONS
     ========================================================= */

  const amount =
    Number(formData.amount) || 0;


  const calculatedSettledAmount =
    useMemo(() => {

      if (
        formData.status === "cleared"
      ) {
        return amount;
      }


      if (
        formData.status === "open"
      ) {
        return 0;
      }


      if (
        formData.status === "partial"
      ) {
        return (
          Number(
            formData.settledAmount
          ) || 0
        );
      }


      return 0;

    }, [
      amount,
      formData.status,
      formData.settledAmount,
    ]);


  const calculatedOutstandingAmount =
    Math.max(
      0,

      amount -
        calculatedSettledAmount
    );


  /* =========================================================
     HANDLE FIELD CHANGE
     ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;


    setFormData((current) => ({
      ...current,

      [name]: value,
    }));


    if (error) {
      setError("");
    }
  };


  /* =========================================================
     CHANGE DIRECTION
     ========================================================= */

  const handleDirectionChange = (
    direction
  ) => {

    setFormData((current) => {

      const currentCategory =
        categories.find(
          (category) =>
            category.id ===
            current.categoryId
        );


      const categoryStillValid =
        !currentCategory ||

        currentCategory.direction ===
          "both" ||

        currentCategory.direction ===
          direction;


      return {
        ...current,

        direction,

        categoryId:
          categoryStillValid
            ? current.categoryId
            : "",
      };
    });


    setError("");
  };


  /* =========================================================
     CHANGE STATUS
     ========================================================= */

  const handleStatusChange = (
    status
  ) => {

    setFormData((current) => ({
      ...current,

      status,

      settledAmount:
        status === "partial"
          ? current.settledAmount
          : "",
    }));


    setError("");
  };


  /* =========================================================
     SAVE TRANSACTION
     ========================================================= */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    if (!currentUser?.uid) {
      setError(
        "You must be signed in to save a transaction."
      );

      return;
    }


    const cleanTitle =
      formData.title.trim();


    const transactionAmount =
      Number(formData.amount);


    /* -------------------------------------------------------
       VALIDATE TITLE
       ------------------------------------------------------- */

    if (!cleanTitle) {
      setError(
        "Please enter a transaction title."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE AMOUNT
       ------------------------------------------------------- */

    if (
      !Number.isFinite(
        transactionAmount
      ) ||

      transactionAmount <= 0
    ) {
      setError(
        "Please enter a valid amount greater than £0."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE DATE
       ------------------------------------------------------- */

    if (!formData.date) {
      setError(
        "Please select a transaction date."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE CATEGORY

       Every transaction must belong to exactly one category.
       ------------------------------------------------------- */

    if (!formData.categoryId) {
      setError(
        "Please select a category for this transaction."
      );

      return;
    }


    /* -------------------------------------------------------
       VALIDATE PARTIAL SETTLEMENT
       ------------------------------------------------------- */

    if (
      formData.status === "partial"
    ) {

      const partialAmount =
        Number(
          formData.settledAmount
        );


      if (
        !Number.isFinite(
          partialAmount
        ) ||

        partialAmount <= 0
      ) {
        setError(
          "Please enter how much has already been settled."
        );

        return;
      }


      if (
        partialAmount >=
        transactionAmount
      ) {
        setError(
          "For a partially settled transaction, the settled amount must be less than the total amount."
        );

        return;
      }
    }


    /* -------------------------------------------------------
       FIND SELECTED CATEGORY

       Only one category can ever be selected.
       ------------------------------------------------------- */

    const selectedCategory =
      categories.find(
        (category) =>
          category.id ===
          formData.categoryId
      ) || null;


    if (!selectedCategory) {
      setError(
        "The selected category could not be found. Please select a valid category."
      );

      return;
    }


    /* -------------------------------------------------------
       BUILD TRANSACTION PAYLOAD
       ------------------------------------------------------- */

    const transactionPayload = {

      /* BASIC DETAILS */

      title: cleanTitle,

      amount: transactionAmount,

      direction:
        formData.direction,

      status:
        formData.status,


      /* SETTLEMENT */

      settledAmount:
        formData.status === "partial"
          ? Number(
              formData.settledAmount
            )
          : 0,


      /* DATE */

      date:
        formData.date,

      dueDate:
        formData.dueDate || "",


      /* CATEGORY

         This is now the only grouping/assignment system.

         It can represent anything:
         - House Expense
         - Cleaning
         - Pocket Money
         - Property 238
         - ABC Builders
         - John Smith
         - Utilities
         - Advertisement
      */

      categoryId:
        selectedCategory.id,

      categoryName:
        selectedCategory.name || "",

      categoryColor:
        selectedCategory.color || "",


      /* PAYMENT */

      paymentMethod:
        formData.paymentMethod || "",


      /* OPTIONAL DETAILS */

      description:
        formData.description,

      notes:
        formData.notes,
    };


    /* -------------------------------------------------------
       SAVE TO FIRESTORE
       ------------------------------------------------------- */

    setSaving(true);

    setError("");

    setSuccessMessage("");


    try {
      await createTransaction(
        currentUser.uid,

        transactionPayload
      );


      setSuccessMessage(
        "Transaction saved successfully."
      );


      setFormData({
        ...DEFAULT_FORM,

        date: getTodayDate(),
      });


      setTimeout(() => {
        navigate(
          "/transactions",

          {
            replace: true,
          }
        );
      }, 700);

    } catch (err) {
      console.error(
        "Create transaction error:",
        err
      );


      setError(
        err.message ||

        "Unable to save this transaction. Please try again."
      );

    } finally {
      setSaving(false);
    }
  };


  return (

    <div className="add-transaction-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="add-transaction-header">

        <div>


          <button
            type="button"
            className="add-transaction-back-button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
          >

            <ArrowLeft
              size={17}
              strokeWidth={2.2}
            />

            Back to transactions

          </button>


          <p className="add-transaction-eyebrow">
            New financial record
          </p>


          <h1>
            Add Transaction
          </h1>


          <p className="add-transaction-description">
            Record money in or money out and assign it to one
            category. A category can represent an expense group,
            property, person, company, project or anything else
            you want to track.
          </p>

        </div>

      </header>


      {/* =====================================================
          SUCCESS MESSAGE
          ===================================================== */}

      {successMessage && (

        <div className="add-transaction-message success">

          <Check
            size={18}
            strokeWidth={2.4}
          />

          <span>
            {successMessage}
          </span>

        </div>

      )}


      {/* =====================================================
          ERROR MESSAGE
          ===================================================== */}

      {error && (

        <div className="add-transaction-message error">

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================================
          LOADING
          ===================================================== */}

      {loadingOptions ? (

        <section className="add-transaction-loading">

          <Loader2
            size={30}
            strokeWidth={2}
            className="add-transaction-spinner"
          />

          <p>
            Loading your categories...
          </p>

        </section>

      ) : (

        <form
          className="add-transaction-form"
          onSubmit={handleSubmit}
        >


          {/* =================================================
              MONEY DIRECTION
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <WalletCards
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Transaction direction
                </h2>

                <p>
                  Is money coming in or going out?
                </p>

              </div>

            </div>


            <div className="transaction-direction-options">


              {/* MONEY IN */}

              <button
                type="button"
                className={`transaction-direction-option money-in ${
                  formData.direction === "in"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleDirectionChange("in")
                }
              >

                <span className="transaction-direction-icon">

                  <ArrowDownLeft
                    size={21}
                    strokeWidth={2.3}
                  />

                </span>


                <span>

                  <strong>
                    Money In
                  </strong>

                  <small>
                    Money coming to you
                  </small>

                </span>

              </button>


              {/* MONEY OUT */}

              <button
                type="button"
                className={`transaction-direction-option money-out ${
                  formData.direction === "out"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleDirectionChange("out")
                }
              >

                <span className="transaction-direction-icon">

                  <ArrowUpRight
                    size={21}
                    strokeWidth={2.3}
                  />

                </span>


                <span>

                  <strong>
                    Money Out
                  </strong>

                  <small>
                    Money leaving you
                  </small>

                </span>

              </button>

            </div>

          </section>


          {/* =================================================
              BASIC DETAILS
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <FileText
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Basic details
                </h2>

                <p>
                  Enter the title, amount and transaction date.
                </p>

              </div>

            </div>


            <div className="transaction-form-grid">


              {/* TITLE */}

              <div className="transaction-form-field full-width">

                <label htmlFor="transaction-title">
                  Transaction title
                  <span>*</span>
                </label>


                <input
                  id="transaction-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Weekly cleaning, rent income or bought coffee"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={saving}
                  autoFocus
                  required
                />

              </div>


              {/* AMOUNT */}

              <div className="transaction-form-field">

                <label htmlFor="transaction-amount">
                  Amount
                  <span>*</span>
                </label>


                <div className="transaction-amount-input">

                  <span>
                    £
                  </span>


                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />

                </div>

              </div>


              {/* DATE */}

              <div className="transaction-form-field">

                <label htmlFor="transaction-date">
                  Transaction date
                  <span>*</span>
                </label>


                <div className="transaction-date-input">

                  <CalendarDays
                    size={17}
                    strokeWidth={2}
                  />


                  <input
                    id="transaction-date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              CATEGORY / GROUP
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <Tag
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Category / Group
                </h2>

                <p>
                  Assign this transaction to exactly one category.
                </p>

              </div>

            </div>


            <div className="transaction-form-grid">

              <div className="transaction-form-field full-width">

                <label htmlFor="transaction-category">
                  Select category
                  <span>*</span>
                </label>


                <div className="transaction-select-input">

                  <Tag
                    size={17}
                    strokeWidth={2}
                  />


                  <select
                    id="transaction-category"
                    name="categoryId"
                    value={
                      formData.categoryId
                    }
                    onChange={handleChange}
                    disabled={saving}
                    required
                  >

                    <option value="">
                      Select a category...
                    </option>


                    {availableCategories.map(
                      (category) => (

                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {availableCategories.length === 0 && (

                  <p
                    style={{
                      margin:
                        "9px 0 0",

                      color:
                        "#b87700",

                      fontSize:
                        "10.5px",
                    }}
                  >
                    No categories are available for this
                    transaction direction. Create or update a
                    category first.
                  </p>

                )}

              </div>

            </div>

          </section>


          {/* =================================================
              PAYMENT STATUS
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <CircleDollarSign
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Payment status
                </h2>

                <p>
                  Choose whether this transaction is settled,
                  outstanding or partially settled.
                </p>

              </div>

            </div>


            <div className="transaction-status-options">


              {/* CLEARED */}

              <button
                type="button"
                className={`transaction-status-option cleared ${
                  formData.status ===
                  "cleared"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleStatusChange(
                    "cleared"
                  )
                }
              >

                <Check
                  size={18}
                  strokeWidth={2.3}
                />


                <span>

                  <strong>
                    Cleared
                  </strong>

                  <small>
                    Fully settled
                  </small>

                </span>

              </button>


              {/* OPEN */}

              <button
                type="button"
                className={`transaction-status-option open ${
                  formData.status ===
                  "open"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleStatusChange(
                    "open"
                  )
                }
              >

                <Clock3
                  size={18}
                  strokeWidth={2.3}
                />


                <span>

                  <strong>
                    Open
                  </strong>

                  <small>
                    Nothing settled yet
                  </small>

                </span>

              </button>


              {/* PARTIAL */}

              <button
                type="button"
                className={`transaction-status-option partial ${
                  formData.status ===
                  "partial"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleStatusChange(
                    "partial"
                  )
                }
              >

                <CircleDollarSign
                  size={18}
                  strokeWidth={2.3}
                />


                <span>

                  <strong>
                    Partially settled
                  </strong>

                  <small>
                    Some money settled
                  </small>

                </span>

              </button>

            </div>


            {/* PARTIAL SETTLEMENT */}

            {formData.status === "partial" && (

              <div className="transaction-partial-section">

                <div className="transaction-form-field">

                  <label htmlFor="settled-amount">
                    Amount already settled
                    <span>*</span>
                  </label>


                  <div className="transaction-amount-input">

                    <span>
                      £
                    </span>


                    <input
                      id="settled-amount"
                      name="settledAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={
                        formData.settledAmount
                      }
                      onChange={handleChange}
                      disabled={saving}
                      required
                    />

                  </div>

                </div>


                <div className="transaction-settlement-preview">


                  <div>

                    <span>
                      Settled
                    </span>

                    <strong>
                      £
                      {calculatedSettledAmount.toFixed(
                        2
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Outstanding
                    </span>

                    <strong>
                      £
                      {calculatedOutstandingAmount.toFixed(
                        2
                      )}
                    </strong>

                  </div>

                </div>

              </div>

            )}

          </section>


          {/* =================================================
              PAYMENT METHOD
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <Landmark
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Payment details
                </h2>

                <p>
                  Add an optional payment method and due date.
                </p>

              </div>

            </div>


            <div className="transaction-form-grid">


              {/* PAYMENT METHOD */}

              <div className="transaction-form-field">

                <label htmlFor="payment-method">
                  Payment method
                  <small>
                    Optional
                  </small>
                </label>


                <div className="transaction-select-input">

                  <Landmark
                    size={17}
                    strokeWidth={2}
                  />


                  <select
                    id="payment-method"
                    name="paymentMethod"
                    value={
                      formData.paymentMethod
                    }
                    onChange={handleChange}
                    disabled={saving}
                  >

                    {PAYMENT_METHODS.map(
                      (method) => (

                        <option
                          key={method.value}
                          value={method.value}
                        >
                          {method.label}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* DUE DATE */}

              <div className="transaction-form-field">

                <label htmlFor="transaction-due-date">
                  Due date
                  <small>
                    Optional
                  </small>
                </label>


                <div className="transaction-date-input">

                  <CalendarDays
                    size={17}
                    strokeWidth={2}
                  />


                  <input
                    id="transaction-due-date"
                    name="dueDate"
                    type="date"
                    value={
                      formData.dueDate
                    }
                    onChange={handleChange}
                    disabled={saving}
                  />

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              DESCRIPTION & NOTES
              ================================================= */}

          <section className="transaction-form-card">

            <div className="transaction-form-card-heading">

              <div className="transaction-form-heading-icon">

                <FileText
                  size={20}
                  strokeWidth={2.1}
                />

              </div>


              <div>

                <h2>
                  Additional details
                </h2>

                <p>
                  Add an optional description or private notes.
                </p>

              </div>

            </div>


            <div className="transaction-form-field">

              <label htmlFor="transaction-description">
                Description
                <small>
                  Optional
                </small>
              </label>


              <textarea
                id="transaction-description"
                name="description"
                rows="4"
                placeholder="Add any useful details about this transaction..."
                value={
                  formData.description
                }
                onChange={handleChange}
                disabled={saving}
              />

            </div>


            <div className="transaction-form-field">

              <label htmlFor="transaction-notes">
                Private notes
                <small>
                  Optional
                </small>
              </label>


              <textarea
                id="transaction-notes"
                name="notes"
                rows="4"
                placeholder="Add private notes for your own reference..."
                value={
                  formData.notes
                }
                onChange={handleChange}
                disabled={saving}
              />

            </div>

          </section>


          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="add-transaction-actions">


            <button
              type="button"
              className="add-transaction-cancel-button"
              onClick={() =>
                navigate(
                  "/transactions"
                )
              }
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="add-transaction-save-button"
              disabled={saving}
            >

              {saving ? (

                <>

                  <Loader2
                    size={18}
                    className="add-transaction-spinner"
                  />

                  Saving transaction...

                </>

              ) : (

                <>

                  <Save
                    size={18}
                    strokeWidth={2.3}
                  />

                  Save transaction

                </>

              )}

            </button>

          </div>

        </form>

      )}

    </div>

  );
}


export default AddTransaction;