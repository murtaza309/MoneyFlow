import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  deleteTransaction,
  getTransactions,
} from "../services/transactionService";

import "../styles/transactions.css";


/* =========================================================
   PAYMENT METHOD LABELS
   ========================================================= */

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  direct_debit: "Direct debit",
  standing_order: "Standing order",
  card: "Card",
  other: "Other",
};


/* =========================================================
   STATUS LABELS
   ========================================================= */

const STATUS_LABELS = {
  cleared: "Cleared",
  open: "Open",
  partial: "Partially settled",
};


/* =========================================================
   TRANSACTIONS PAGE
   ========================================================= */

function Transactions() {
  const navigate = useNavigate();

  const { currentUser } = useAuth();


  /* =========================================================
     DATA STATE
     ========================================================= */

  const [transactions, setTransactions] =
    useState([]);


  /* =========================================================
     UI STATE
     ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =========================================================
     FILTER STATE
     ========================================================= */

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [directionFilter, setDirectionFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");


  /* =========================================================
     LOAD TRANSACTIONS
     ========================================================= */

  const loadTransactions = async () => {
    if (!currentUser?.uid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const transactionList =
        await getTransactions(
          currentUser.uid
        );

      setTransactions(transactionList);

    } catch (err) {
      console.error(
        "Load transactions error:",
        err
      );

      setError(
        "Unable to load transactions. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadTransactions();
  }, [currentUser?.uid]);


  /* =========================================================
     CURRENCY FORMATTER
     ========================================================= */

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);


  const formatCurrency = (value) => {
    return currencyFormatter.format(
      Number(value) || 0
    );
  };


  /* =========================================================
     DATE FORMATTER
     ========================================================= */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "No date";
    }

    const parts = dateValue.split("-");

    if (parts.length !== 3) {
      return dateValue;
    }

    const [
      year,
      month,
      day,
    ] = parts;


    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );


    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };


  /* =========================================================
     FILTERED TRANSACTIONS
     ========================================================= */

  const filteredTransactions = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();


    return transactions.filter(
      (transaction) => {

        /* SEARCH */

        const matchesSearch =
          !search ||
          transaction.title
            ?.toLowerCase()
            .includes(search) ||
          transaction.partyName
            ?.toLowerCase()
            .includes(search) ||
          transaction.categoryName
            ?.toLowerCase()
            .includes(search) ||
          transaction.propertyName
            ?.toLowerCase()
            .includes(search) ||
          transaction.description
            ?.toLowerCase()
            .includes(search) ||
          transaction.paymentMethod
            ?.toLowerCase()
            .includes(search);


        /* DIRECTION */

        const matchesDirection =
          directionFilter === "all" ||
          transaction.direction ===
            directionFilter;


        /* STATUS */

        const matchesStatus =
          statusFilter === "all" ||
          transaction.status ===
            statusFilter;


        return (
          matchesSearch &&
          matchesDirection &&
          matchesStatus
        );
      }
    );

  }, [
    transactions,
    searchTerm,
    directionFilter,
    statusFilter,
  ]);


  /* =========================================================
     SUMMARY TOTALS

     These totals follow the currently displayed filters.
     ========================================================= */

  const summary = useMemo(() => {

    return filteredTransactions.reduce(
      (totals, transaction) => {

        const amount =
          Number(transaction.amount) || 0;

        const outstanding =
          Number(
            transaction.outstandingAmount
          ) || 0;


        totals.totalTransactions += 1;


        if (
          transaction.direction === "in"
        ) {
          totals.moneyIn += amount;
        }


        if (
          transaction.direction === "out"
        ) {
          totals.moneyOut += amount;
        }


        totals.outstanding += outstanding;


        return totals;
      },

      {
        totalTransactions: 0,
        moneyIn: 0,
        moneyOut: 0,
        outstanding: 0,
      }
    );

  }, [filteredTransactions]);


  /* =========================================================
     DELETE TRANSACTION
     ========================================================= */

  const handleDelete = async (
    transaction
  ) => {
    if (!currentUser?.uid) {
      return;
    }


    const confirmed = window.confirm(
      `Delete "${transaction.title}" permanently?\n\n` +
        `Amount: ${formatCurrency(transaction.amount)}\n\n` +
        "This transaction will be removed from totals, reports, khaatas, properties and categories."
    );


    if (!confirmed) {
      return;
    }


    setDeletingId(transaction.id);

    setError("");

    setSuccessMessage("");


    try {
      await deleteTransaction(
        currentUser.uid,
        transaction.id
      );


      setTransactions((current) =>
        current.filter(
          (item) =>
            item.id !== transaction.id
        )
      );


      setSuccessMessage(
        `"${transaction.title}" has been deleted.`
      );

    } catch (err) {
      console.error(
        "Delete transaction error:",
        err
      );


      setError(
        "Unable to delete this transaction. Please try again."
      );

    } finally {
      setDeletingId("");
    }
  };


  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const handleResetFilters = () => {
    setSearchTerm("");

    setDirectionFilter("all");

    setStatusFilter("all");
  };


  /* =========================================================
     ACTIVE FILTER CHECK
     ========================================================= */

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    directionFilter !== "all" ||
    statusFilter !== "all";


  return (
    <div className="transactions-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="transactions-header">

        <div>

          <p className="transactions-eyebrow">
            Money activity
          </p>


          <h1>
            Transactions
          </h1>


          <p className="transactions-description">
            View and manage all money in, money out,
            outstanding balances and cleared transactions.
          </p>

        </div>


        <button
          type="button"
          className="transactions-add-button"
          onClick={() =>
            navigate("/transactions/new")
          }
        >
          <Plus
            size={19}
            strokeWidth={2.4}
          />

          <span>
            Add transaction
          </span>
        </button>

      </header>


      {/* =====================================================
          ERROR MESSAGE
          ===================================================== */}

      {error && (

        <div className="transactions-message error">

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


      {/* =====================================================
          SUCCESS MESSAGE
          ===================================================== */}

      {successMessage && (

        <div className="transactions-message success">

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
          SUMMARY
          ===================================================== */}

      <section className="transactions-summary">

        <div className="transactions-summary-item">

          <span>
            Total transactions
          </span>

          <strong>
            {summary.totalTransactions}
          </strong>

        </div>


        <div className="transactions-summary-item">

          <span>
            Money in
          </span>

          <strong className="money-in">
            {formatCurrency(
              summary.moneyIn
            )}
          </strong>

        </div>


        <div className="transactions-summary-item">

          <span>
            Money out
          </span>

          <strong className="money-out">
            {formatCurrency(
              summary.moneyOut
            )}
          </strong>

        </div>


        <div className="transactions-summary-item">

          <span>
            Outstanding
          </span>

          <strong className="outstanding">
            {formatCurrency(
              summary.outstanding
            )}
          </strong>

        </div>

      </section>


      {/* =====================================================
          SEARCH & FILTERS
          ===================================================== */}

      <section className="transactions-toolbar">

        <div className="transactions-search">

          <Search
            size={18}
            strokeWidth={2}
          />

          <input
            type="search"
            placeholder="Search title, category, property or person..."
            aria-label="Search transactions"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>


        <button
          type="button"
          className={`transactions-filter-button ${
            showFilters ||
            directionFilter !== "all" ||
            statusFilter !== "all"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setShowFilters(
              (current) => !current
            )
          }
        >
          <Filter
            size={18}
            strokeWidth={2}
          />

          <span>
            Filters
          </span>

        </button>

      </section>


      {/* =====================================================
          FILTER PANEL
          ===================================================== */}

      {showFilters && (

        <section className="transactions-filter-panel">

          <div className="transactions-filter-field">

            <label htmlFor="direction-filter">
              Direction
            </label>

            <select
              id="direction-filter"
              value={directionFilter}
              onChange={(event) =>
                setDirectionFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                Money In & Out
              </option>

              <option value="in">
                Money In
              </option>

              <option value="out">
                Money Out
              </option>
            </select>

          </div>


          <div className="transactions-filter-field">

            <label htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
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


          {hasActiveFilters && (

            <button
              type="button"
              className="transactions-reset-filters"
              onClick={handleResetFilters}
            >
              Reset filters
            </button>

          )}

        </section>

      )}


      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading ? (

        <section className="transactions-loading">

          <Loader2
            size={30}
            strokeWidth={2}
            className="transactions-spinner"
          />

          <p>
            Loading transactions...
          </p>

        </section>

      ) : filteredTransactions.length === 0 ? (


        /* ===================================================
           EMPTY STATE
           =================================================== */

        <section className="transactions-list-card">

          <div className="transactions-empty-state">

            <div className="transactions-empty-icon">

              <ArrowLeftRight
                size={30}
                strokeWidth={1.8}
              />

            </div>


            <h2>
              {hasActiveFilters
                ? "No matching transactions"
                : "No transactions yet"}
            </h2>


            <p>
              {hasActiveFilters
                ? "Try changing or resetting your search and filters."
                : "Add your first transaction to start tracking money in, money out, personal expenses, people, companies, properties and outstanding balances."}
            </p>


            {!hasActiveFilters && (

              <button
                type="button"
                className="transactions-empty-button"
                onClick={() =>
                  navigate(
                    "/transactions/new"
                  )
                }
              >
                <Plus
                  size={18}
                  strokeWidth={2.4}
                />

                Add first transaction
              </button>

            )}

          </div>

        </section>

      ) : (


        /* ===================================================
           REAL TRANSACTION LIST
           =================================================== */

        <section className="transactions-list">

          {filteredTransactions.map(
            (transaction) => {

              const isDeleting =
                deletingId ===
                transaction.id;


              const isMoneyIn =
                transaction.direction ===
                "in";


              const outstandingAmount =
                Number(
                  transaction.outstandingAmount
                ) || 0;


              const settledAmount =
                Number(
                  transaction.settledAmount
                ) || 0;


              return (

                <article
                  key={transaction.id}
                  className={`transaction-item-card ${
                    isMoneyIn
                      ? "money-in"
                      : "money-out"
                  }`}
                >


                  {/* =========================================
                      LEFT ICON
                      ========================================= */}

                  <div
                    className={`transaction-item-direction-icon ${
                      isMoneyIn
                        ? "money-in"
                        : "money-out"
                    }`}
                  >

                    {isMoneyIn ? (

                      <ArrowDownLeft
                        size={21}
                        strokeWidth={2.3}
                      />

                    ) : (

                      <ArrowUpRight
                        size={21}
                        strokeWidth={2.3}
                      />

                    )}

                  </div>


                  {/* =========================================
                      MAIN CONTENT
                      ========================================= */}

                  <div className="transaction-item-main">


                    <div className="transaction-item-heading">

                      <div>

                        <h2>
                          {transaction.title}
                        </h2>


                        <div className="transaction-item-badges">

                          <span
                            className={`transaction-direction-badge ${
                              isMoneyIn
                                ? "money-in"
                                : "money-out"
                            }`}
                          >
                            {isMoneyIn
                              ? "Money In"
                              : "Money Out"}
                          </span>


                          <span
                            className={`transaction-status-badge ${
                              transaction.status ||
                              "cleared"
                            }`}
                          >
                            {
                              STATUS_LABELS[
                                transaction.status
                              ] || "Cleared"
                            }
                          </span>

                        </div>

                      </div>


                      <div className="transaction-item-amount">

                        <strong
                          className={
                            isMoneyIn
                              ? "money-in"
                              : "money-out"
                          }
                        >
                          {isMoneyIn
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            transaction.amount
                          )}
                        </strong>


                        <span>
                          {formatDate(
                            transaction.date
                          )}
                        </span>

                      </div>

                    </div>


                    {/* =======================================
                        META DETAILS
                        ======================================= */}

                    <div className="transaction-item-meta">


                      {transaction.categoryName && (

                        <span>

                          <Tag
                            size={14}
                            strokeWidth={2}
                          />

                          {
                            transaction.categoryName
                          }

                        </span>

                      )}


                      {transaction.partyName && (

                        <span>

                          <UserRound
                            size={14}
                            strokeWidth={2}
                          />

                          {
                            transaction.partyName
                          }

                        </span>

                      )}


                      {transaction.propertyName && (

                        <span>

                          <Building2
                            size={14}
                            strokeWidth={2}
                          />

                          {
                            transaction.propertyName
                          }

                        </span>

                      )}


                      {transaction.paymentMethod && (

                        <span>

                          <WalletCards
                            size={14}
                            strokeWidth={2}
                          />

                          {
                            PAYMENT_METHOD_LABELS[
                              transaction.paymentMethod
                            ] ||
                            transaction.paymentMethod
                          }

                        </span>

                      )}


                      {transaction.dueDate && (

                        <span>

                          <CalendarDays
                            size={14}
                            strokeWidth={2}
                          />

                          Due{" "}
                          {formatDate(
                            transaction.dueDate
                          )}

                        </span>

                      )}

                    </div>


                    {/* =======================================
                        DESCRIPTION
                        ======================================= */}

                    {transaction.description && (

                      <p className="transaction-item-description">
                        {transaction.description}
                      </p>

                    )}


                    {/* =======================================
                        SETTLEMENT DETAILS
                        ======================================= */}

                    {transaction.status !==
                      "cleared" && (

                      <div className="transaction-item-settlement">

                        <div>

                          <span>
                            Settled
                          </span>

                          <strong>
                            {formatCurrency(
                              settledAmount
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Outstanding
                          </span>

                          <strong>
                            {formatCurrency(
                              outstandingAmount
                            )}
                          </strong>

                        </div>

                      </div>

                    )}

                  </div>


                  {/* =========================================
                      DELETE ACTION
                      ========================================= */}

                  <div className="transaction-item-actions">

                    <button
                      type="button"
                      className="transaction-delete-button"
                      onClick={() =>
                        handleDelete(
                          transaction
                        )
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${transaction.title}`}
                      title="Delete transaction"
                    >

                      {isDeleting ? (

                        <Loader2
                          size={17}
                          className="transactions-spinner"
                        />

                      ) : (

                        <Trash2
                          size={17}
                          strokeWidth={2}
                        />

                      )}

                    </button>

                  </div>

                </article>

              );
            }
          )}

        </section>

      )}

    </div>
  );
}


export default Transactions;