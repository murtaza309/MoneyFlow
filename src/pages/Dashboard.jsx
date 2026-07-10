import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  Loader2,
  Plus,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getTransactions,
} from "../services/transactionService";

import "../styles/dashboard.css";


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  const navigate = useNavigate();

  const { currentUser } = useAuth();


  /* =========================================================
     STATE
     ========================================================= */

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================================
     LOAD REAL TRANSACTIONS FROM FIRESTORE
     ========================================================= */

  useEffect(() => {
    const loadDashboardData = async () => {
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


        setTransactions(
          transactionList
        );

      } catch (err) {
        console.error(
          "Dashboard transaction load error:",
          err
        );


        setError(
          "Unable to load dashboard data. Please refresh and try again."
        );

      } finally {
        setLoading(false);
      }
    };


    loadDashboardData();

  }, [currentUser?.uid]);


  /* =========================================================
     CURRENCY FORMATTER
     ========================================================= */

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

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
      return "";
    }


    const parts =
      dateValue.split("-");


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
     GET SAFE TRANSACTION AMOUNTS

     This also supports older records in case any transaction
     does not yet contain settledAmount or outstandingAmount.
     ========================================================= */

  const getTransactionValues = (
    transaction
  ) => {
    const amount =
      Number(transaction.amount) || 0;


    let settledAmount =
      Number(transaction.settledAmount);


    if (
      !Number.isFinite(settledAmount)
    ) {
      settledAmount =
        transaction.status === "cleared"
          ? amount
          : 0;
    }


    let outstandingAmount =
      Number(
        transaction.outstandingAmount
      );


    if (
      !Number.isFinite(
        outstandingAmount
      )
    ) {
      outstandingAmount =
        Math.max(
          0,
          amount - settledAmount
        );
    }


    return {
      amount,
      settledAmount,
      outstandingAmount,
    };
  };


  /* =========================================================
     ALL DASHBOARD TOTALS
     ========================================================= */

  const dashboardTotals = useMemo(() => {
    const totals = {
      moneyReceived: 0,

      moneyPaid: 0,

      toReceive: 0,

      toPay: 0,

      totalIncomingValue: 0,

      totalOutgoingValue: 0,

      overallBalance: 0,

      monthMoneyIn: 0,

      monthMoneyOut: 0,
    };


    const now = new Date();


    const currentYear =
      now.getFullYear();


    const currentMonth =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");


    const currentMonthPrefix =
      `${currentYear}-${currentMonth}`;


    transactions.forEach(
      (transaction) => {

        const {
          amount,
          settledAmount,
          outstandingAmount,
        } = getTransactionValues(
          transaction
        );


        /* ---------------------------------------------
           MONEY IN
           --------------------------------------------- */

        if (
          transaction.direction === "in"
        ) {
          totals.moneyReceived +=
            settledAmount;


          totals.toReceive +=
            outstandingAmount;


          totals.totalIncomingValue +=
            amount;


          if (
            transaction.date?.startsWith(
              currentMonthPrefix
            )
          ) {
            totals.monthMoneyIn +=
              amount;
          }
        }


        /* ---------------------------------------------
           MONEY OUT
           --------------------------------------------- */

        if (
          transaction.direction === "out"
        ) {
          totals.moneyPaid +=
            settledAmount;


          totals.toPay +=
            outstandingAmount;


          totals.totalOutgoingValue +=
            amount;


          if (
            transaction.date?.startsWith(
              currentMonthPrefix
            )
          ) {
            totals.monthMoneyOut +=
              amount;
          }
        }

      }
    );


    totals.overallBalance =
      totals.totalIncomingValue -
      totals.totalOutgoingValue;


    return totals;

  }, [transactions]);


  /* =========================================================
     RECENT TRANSACTIONS
     ========================================================= */

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);

  }, [transactions]);


  /* =========================================================
     DYNAMIC GREETING
     ========================================================= */

  const greeting = useMemo(() => {
    const hour =
      new Date().getHours();


    if (hour < 12) {
      return "Good morning";
    }


    if (hour < 18) {
      return "Good afternoon";
    }


    return "Good evening";

  }, []);


  /* =========================================================
     SUMMARY CARDS
     ========================================================= */

  const summaryCards = [
    {
      title: "Money Received",

      value: formatCurrency(
        dashboardTotals.moneyReceived
      ),

      subtitle:
        "Actual money received",

      icon: ArrowDownLeft,

      type: "income",
    },

    {
      title: "Money Paid",

      value: formatCurrency(
        dashboardTotals.moneyPaid
      ),

      subtitle:
        "Actual money paid out",

      icon: ArrowUpRight,

      type: "expense",
    },

    {
      title: "To Receive",

      value: formatCurrency(
        dashboardTotals.toReceive
      ),

      subtitle:
        "Still outstanding to you",

      icon: CircleDollarSign,

      type: "receivable",
    },

    {
      title: "To Pay",

      value: formatCurrency(
        dashboardTotals.toPay
      ),

      subtitle:
        "Still outstanding from you",

      icon: Clock3,

      type: "payable",
    },
  ];


  /* =========================================================
     BALANCE STATUS
     ========================================================= */

  const getBalanceStatus = () => {
    const balance =
      dashboardTotals.overallBalance;


    if (balance > 0) {
      return "Positive balance";
    }


    if (balance < 0) {
      return "Negative balance";
    }


    return "Balanced";
  };


  return (
    <div className="dashboard-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="dashboard-header">

        <div>

          <p className="dashboard-eyebrow">
            Overview
          </p>


          <h1>
            {greeting} 👋
          </h1>


          <p className="dashboard-header-description">
            Here&apos;s a complete overview of your
            MoneyFlow activity.
          </p>

        </div>


        <button
          type="button"
          className="dashboard-add-button"
          onClick={() =>
            navigate(
              "/transactions/new"
            )
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

          Using existing dashboard structure — no new CSS needed.
          ===================================================== */}

      {error && (

        <div className="dashboard-empty-state">

          <div className="dashboard-empty-icon">

            <ReceiptText
              size={28}
              strokeWidth={1.8}
            />

          </div>


          <h3>
            Unable to load dashboard
          </h3>


          <p>
            {error}
          </p>

        </div>

      )}


      {/* =====================================================
          MAIN SUMMARY CARDS
          ===================================================== */}

      <section className="dashboard-summary-grid">

        {summaryCards.map((card) => {
          const Icon = card.icon;


          return (

            <article
              key={card.title}
              className={
                `dashboard-summary-card ${card.type}`
              }
            >

              <div className="dashboard-card-top">

                <div
                  className={
                    `dashboard-card-icon ${card.type}`
                  }
                >
                  <Icon
                    size={21}
                    strokeWidth={2.2}
                  />
                </div>


                <span className="dashboard-card-period">
                  All time
                </span>

              </div>


              <div className="dashboard-card-content">

                <p>
                  {card.title}
                </p>


                <h2>
                  {loading
                    ? "..."
                    : card.value}
                </h2>


                <span>
                  {card.subtitle}
                </span>

              </div>

            </article>

          );
        })}

      </section>


      {/* =====================================================
          SECONDARY SUMMARY
          ===================================================== */}

      <section className="dashboard-secondary-grid">


        {/* OVERALL BALANCE */}

        <article className="dashboard-balance-card">

          <div className="dashboard-section-heading">

            <div>

              <p>
                Net position
              </p>


              <h2>
                Overall Balance
              </h2>

            </div>


            <div className="dashboard-balance-icon">

              <Wallet
                size={22}
                strokeWidth={2.2}
              />

            </div>

          </div>


          <div className="dashboard-balance-value">

            <span>
              {loading
                ? "..."
                : formatCurrency(
                    dashboardTotals
                      .overallBalance
                  )}
            </span>


            <div
              className="dashboard-balance-status positive"
              style={
                dashboardTotals
                  .overallBalance < 0
                  ? {
                      color: "#c84848",
                    }
                  : undefined
              }
            >

              <TrendingUp
                size={15}
                strokeWidth={2.2}
              />

              {getBalanceStatus()}

            </div>

          </div>


          <div className="dashboard-balance-breakdown">

            <div>

              <span>
                Total incoming value
              </span>


              <strong>
                {formatCurrency(
                  dashboardTotals
                    .totalIncomingValue
                )}
              </strong>

            </div>


            <div>

              <span>
                Total outgoing value
              </span>


              <strong>
                {formatCurrency(
                  dashboardTotals
                    .totalOutgoingValue
                )}
              </strong>

            </div>

          </div>

        </article>


        {/* THIS MONTH */}

        <article className="dashboard-month-card">

          <div className="dashboard-section-heading">

            <div>

              <p>
                Current month
              </p>


              <h2>
                This Month
              </h2>

            </div>


            <div className="dashboard-month-icon">

              <ReceiptText
                size={22}
                strokeWidth={2.2}
              />

            </div>

          </div>


          <div className="dashboard-month-stats">


            <div className="dashboard-month-stat">

              <span className="stat-dot income" />


              <div>

                <p>
                  Money in
                </p>


                <strong>
                  {formatCurrency(
                    dashboardTotals
                      .monthMoneyIn
                  )}
                </strong>

              </div>

            </div>


            <div className="dashboard-month-stat">

              <span className="stat-dot expense" />


              <div>

                <p>
                  Money out
                </p>


                <strong>
                  {formatCurrency(
                    dashboardTotals
                      .monthMoneyOut
                  )}
                </strong>

              </div>

            </div>

          </div>

        </article>

      </section>


      {/* =====================================================
          RECENT TRANSACTIONS
          ===================================================== */}

      <section className="dashboard-recent-section">

        <div className="dashboard-section-header-row">

          <div>

            <p className="dashboard-section-label">
              Latest activity
            </p>


            <h2>
              Recent transactions
            </h2>

          </div>


          <button
            type="button"
            className="dashboard-view-all-button"
            onClick={() =>
              navigate("/transactions")
            }
          >
            View all
          </button>

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="dashboard-empty-state">

            <div className="dashboard-empty-icon">

              <Loader2
                size={28}
                strokeWidth={1.8}
              />

            </div>


            <h3>
              Loading transactions...
            </h3>


            <p>
              Fetching your latest MoneyFlow activity.
            </p>

          </div>

        ) : recentTransactions.length === 0 ? (


          /* EMPTY STATE */

          <div className="dashboard-empty-state">

            <div className="dashboard-empty-icon">

              <ReceiptText
                size={28}
                strokeWidth={1.8}
              />

            </div>


            <h3>
              No transactions yet
            </h3>


            <p>
              Add your first transaction to start
              tracking money in, money out, balances
              and outstanding amounts.
            </p>


            <button
              type="button"
              className="dashboard-empty-add-button"
              onClick={() =>
                navigate(
                  "/transactions/new"
                )
              }
            >
              <Plus
                size={18}
                strokeWidth={2.3}
              />

              Add first transaction
            </button>

          </div>

        ) : (


          /* REAL RECENT TRANSACTIONS

             Reuses your existing dashboard-month-stats and
             dashboard-month-stat CSS classes, so no new CSS
             is required.
          */

          <div className="dashboard-month-stats">

            {recentTransactions.map(
              (transaction) => {

                const isMoneyIn =
                  transaction.direction ===
                  "in";


                return (

                  <div
                    key={transaction.id}
                    className="dashboard-month-stat"
                  >

                    <span
                      className={
                        `stat-dot ${
                          isMoneyIn
                            ? "income"
                            : "expense"
                        }`
                      }
                    />


                    <div>

                      <p>
                        {transaction.title}
                      </p>


                      <strong>
                        {isMoneyIn
                          ? "+"
                          : "-"}
                        {formatCurrency(
                          transaction.amount
                        )}
                      </strong>


                      {transaction.date && (

                        <span>
                          {formatDate(
                            transaction.date
                          )}
                        </span>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}


export default Dashboard;