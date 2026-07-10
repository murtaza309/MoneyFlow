import "../styles/reports.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  ReceiptText,
  RefreshCw,
  Tag,
  Wallet,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCategories,
} from "../services/categoryService";

import {
  getTransactions,
} from "../services/transactionService";


/* =========================================================
   REPORT TABS
   ========================================================= */

const REPORT_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    id: "categories",
    label: "Categories",
    icon: Tag,
  },
  {
    id: "outstanding",
    label: "Outstanding",
    icon: Clock3,
  },
];


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
   FILTER LABELS
   ========================================================= */

const PERIOD_LABELS = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
  custom: "Custom date range",
};

const DIRECTION_LABELS = {
  all: "Money In & Out",
  in: "Money In only",
  out: "Money Out only",
};

const FILTER_STATUS_LABELS = {
  all: "All statuses",
  cleared: "Cleared",
  open: "Open",
  partial: "Partially settled",
};


/* =========================================================
   LOCAL DATE HELPER
   ========================================================= */

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   REPORTS
   ========================================================= */

function Reports() {
  const { currentUser } = useAuth();


  /* =========================================================
     TAB
     ========================================================= */

  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");


  /* =========================================================
     FIRESTORE DATA
     ========================================================= */

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);


  /* =========================================================
     SELECTED CATEGORY
     ========================================================= */

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState("");


  /* =========================================================
     UI STATE
     ========================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exportingPdf,
    setExportingPdf,
  ] = useState(false);


  /* =========================================================
     FILTERS
     ========================================================= */

  const [
    filters,
    setFilters,
  ] = useState({
    period: "all",

    startDate: "",

    endDate: "",

    direction: "all",

    status: "all",

    categoryId: "",
  });


  /* =========================================================
     LOAD CATEGORIES + TRANSACTIONS
     ========================================================= */

  useEffect(() => {
    const loadReportData = async () => {
      if (!currentUser?.uid) {
        return;
      }

      setLoading(true);

      setError("");

      try {
        const [
          categoryList,
          transactionList,
        ] = await Promise.all([
          getCategories(
            currentUser.uid
          ),

          getTransactions(
            currentUser.uid
          ),
        ]);

        setCategories(
          categoryList
        );

        setTransactions(
          transactionList
        );

      } catch (err) {
        console.error(
          "Unable to load reports:",
          err
        );

        setError(
          "Unable to load report data. Please refresh and try again."
        );

      } finally {
        setLoading(false);
      }
    };

    loadReportData();

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
      return "No date";
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
     SAFE TRANSACTION VALUES
     ========================================================= */

  const getTransactionValues = (
    transaction
  ) => {

    const amount =
      Number(transaction.amount) || 0;

    let settledAmount =
      Number(
        transaction.settledAmount
      );

    if (
      !Number.isFinite(
        settledAmount
      )
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

          amount -
            settledAmount
        );
    }

    return {
      amount,

      settledAmount,

      outstandingAmount,
    };
  };


  /* =========================================================
     PERIOD LIMITS
     ========================================================= */

  const periodLimits = useMemo(() => {

    const today = new Date();

    const todayString =
      getLocalDateString(
        today
      );


    /* TODAY */

    if (
      filters.period === "today"
    ) {
      return {
        startDate: todayString,

        endDate: todayString,
      };
    }


    /* THIS WEEK */

    if (
      filters.period === "week"
    ) {
      const startOfWeek =
        new Date(today);

      const dayOfWeek =
        startOfWeek.getDay();

      const difference =
        dayOfWeek === 0
          ? -6
          : 1 - dayOfWeek;

      startOfWeek.setDate(
        startOfWeek.getDate() +
          difference
      );

      return {
        startDate:
          getLocalDateString(
            startOfWeek
          ),

        endDate: todayString,
      };
    }


    /* THIS MONTH */

    if (
      filters.period === "month"
    ) {
      const startOfMonth =
        new Date(
          today.getFullYear(),

          today.getMonth(),

          1
        );

      return {
        startDate:
          getLocalDateString(
            startOfMonth
          ),

        endDate: todayString,
      };
    }


    /* THIS YEAR */

    if (
      filters.period === "year"
    ) {
      const startOfYear =
        new Date(
          today.getFullYear(),

          0,

          1
        );

      return {
        startDate:
          getLocalDateString(
            startOfYear
          ),

        endDate: todayString,
      };
    }


    /* CUSTOM */

    if (
      filters.period === "custom"
    ) {
      return {
        startDate:
          filters.startDate || "",

        endDate:
          filters.endDate || "",
      };
    }


    /* ALL TIME */

    return {
      startDate: "",

      endDate: "",
    };

  }, [
    filters.period,
    filters.startDate,
    filters.endDate,
  ]);


  /* =========================================================
     BASE FILTERED TRANSACTIONS

     Applies:
     - Period
     - Direction
     - Status

     Category is deliberately applied separately.
     ========================================================= */

  const baseFilteredTransactions =
    useMemo(() => {

      return transactions.filter(
        (transaction) => {

          const transactionDate =
            transaction.date || "";


          /* DATE */

          const matchesStartDate =
            !periodLimits.startDate ||

            (
              transactionDate &&

              transactionDate >=
                periodLimits.startDate
            );


          const matchesEndDate =
            !periodLimits.endDate ||

            (
              transactionDate &&

              transactionDate <=
                periodLimits.endDate
            );


          /* DIRECTION */

          const matchesDirection =
            filters.direction ===
              "all" ||

            transaction.direction ===
              filters.direction;


          /* STATUS */

          const matchesStatus =
            filters.status ===
              "all" ||

            transaction.status ===
              filters.status;


          return (
            matchesStartDate &&

            matchesEndDate &&

            matchesDirection &&

            matchesStatus
          );
        }
      );

    }, [
      transactions,

      filters.direction,

      filters.status,

      periodLimits,
    ]);


  /* =========================================================
     FULLY FILTERED TRANSACTIONS

     This is the exact list used by:
     - Summary totals
     - CSV export
     - PDF export
     ========================================================= */

  const filteredTransactions =
    useMemo(() => {

      if (!filters.categoryId) {
        return baseFilteredTransactions;
      }

      return baseFilteredTransactions.filter(
        (transaction) =>
          transaction.categoryId ===
          filters.categoryId
      );

    }, [
      baseFilteredTransactions,

      filters.categoryId,
    ]);


  /* =========================================================
     MAIN REPORT DATA
     ========================================================= */

  const reportData = useMemo(() => {

    const data = {
      totalTransactions: 0,

      totalIncomingValue: 0,

      totalOutgoingValue: 0,

      moneyReceived: 0,

      moneyPaid: 0,

      toReceive: 0,

      toPay: 0,

      netPosition: 0,

      outstandingTransactions: [],
    };


    filteredTransactions.forEach(
      (transaction) => {

        const {
          amount,
          settledAmount,
          outstandingAmount,
        } = getTransactionValues(
          transaction
        );


        data.totalTransactions += 1;


        /* MONEY IN */

        if (
          transaction.direction === "in"
        ) {
          data.totalIncomingValue +=
            amount;

          data.moneyReceived +=
            settledAmount;

          data.toReceive +=
            outstandingAmount;
        }


        /* MONEY OUT */

        if (
          transaction.direction === "out"
        ) {
          data.totalOutgoingValue +=
            amount;

          data.moneyPaid +=
            settledAmount;

          data.toPay +=
            outstandingAmount;
        }


        /* OUTSTANDING */

        if (
          outstandingAmount > 0
        ) {
          data.outstandingTransactions.push({
            ...transaction,

            calculatedSettledAmount:
              settledAmount,

            calculatedOutstandingAmount:
              outstandingAmount,
          });
        }

      }
    );


    data.netPosition =
      data.totalIncomingValue -
      data.totalOutgoingValue;


    return data;

  }, [filteredTransactions]);


  /* =========================================================
     CATEGORY BREAKDOWN
     ========================================================= */

  const categoryBreakdown = useMemo(() => {

    const categoryMap =
      new Map();


    /* ADD EVERY CATEGORY */

    categories.forEach(
      (category) => {

        categoryMap.set(
          category.id,

          {
            id: category.id,

            name:
              category.name ||
              "Unnamed category",

            color:
              category.color ||
              "#25c986",

            transactionCount: 0,

            incoming: 0,

            outgoing: 0,

            received: 0,

            paid: 0,

            toReceive: 0,

            toPay: 0,

            netPosition: 0,
          }
        );

      }
    );


    /* ADD TRANSACTIONS TO EACH CATEGORY */

    baseFilteredTransactions.forEach(
      (transaction) => {

        const categoryId =
          transaction.categoryId;


        if (!categoryId) {
          return;
        }


        if (
          !categoryMap.has(
            categoryId
          )
        ) {
          categoryMap.set(
            categoryId,

            {
              id: categoryId,

              name:
                transaction.categoryName ||
                "Unknown category",

              color:
                transaction.categoryColor ||
                "#64748b",

              transactionCount: 0,

              incoming: 0,

              outgoing: 0,

              received: 0,

              paid: 0,

              toReceive: 0,

              toPay: 0,

              netPosition: 0,
            }
          );
        }


        const category =
          categoryMap.get(
            categoryId
          );


        const {
          amount,
          settledAmount,
          outstandingAmount,
        } = getTransactionValues(
          transaction
        );


        category.transactionCount += 1;


        if (
          transaction.direction === "in"
        ) {
          category.incoming +=
            amount;

          category.received +=
            settledAmount;

          category.toReceive +=
            outstandingAmount;
        }


        if (
          transaction.direction === "out"
        ) {
          category.outgoing +=
            amount;

          category.paid +=
            settledAmount;

          category.toPay +=
            outstandingAmount;
        }

      }
    );


    return Array.from(
      categoryMap.values()
    )
      .map(
        (category) => ({
          ...category,

          netPosition:
            category.incoming -
            category.outgoing,
        })
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

  }, [
    categories,

    baseFilteredTransactions,
  ]);


  /* =========================================================
     SELECTED CATEGORY
     ========================================================= */

  const selectedCategory =
    useMemo(() => {

      if (!selectedCategoryId) {
        return null;
      }


      return (
        categoryBreakdown.find(
          (category) =>
            category.id ===
            selectedCategoryId
        ) || null
      );

    }, [
      categoryBreakdown,

      selectedCategoryId,
    ]);


  /* =========================================================
     SELECTED CATEGORY TRANSACTIONS
     ========================================================= */

  const selectedCategoryTransactions =
    useMemo(() => {

      if (!selectedCategoryId) {
        return [];
      }


      return baseFilteredTransactions.filter(
        (transaction) =>
          transaction.categoryId ===
          selectedCategoryId
      );

    }, [
      baseFilteredTransactions,

      selectedCategoryId,
    ]);


  /* =========================================================
     FILTER CHANGE
     ========================================================= */

  const handleFilterChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFilters((current) => ({
      ...current,

      [name]: value,
    }));


    if (
      name === "categoryId"
    ) {
      setSelectedCategoryId(
        value
      );


      if (value) {
        setActiveTab(
          "categories"
        );
      }
    }
  };


  /* =========================================================
     CLICK CATEGORY
     ========================================================= */

  const handleCategoryClick = (
    category
  ) => {

    setSelectedCategoryId(
      category.id
    );


    setFilters((current) => ({
      ...current,

      categoryId:
        category.id,
    }));


    setActiveTab(
      "categories"
    );
  };


  /* =========================================================
     BACK TO ALL CATEGORIES
     ========================================================= */

  const handleBackToCategories = () => {

    setSelectedCategoryId("");


    setFilters((current) => ({
      ...current,

      categoryId: "",
    }));
  };


  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const handleResetFilters = () => {

    setFilters({
      period: "all",

      startDate: "",

      endDate: "",

      direction: "all",

      status: "all",

      categoryId: "",
    });


    setSelectedCategoryId("");
  };


  /* =========================================================
     CSV EXPORT
     ========================================================= */

  const handleExportCsv = () => {

    if (
      filteredTransactions.length === 0
    ) {
      return;
    }


    const headers = [
      "Title",

      "Amount",

      "Direction",

      "Status",

      "Settled Amount",

      "Outstanding Amount",

      "Date",

      "Due Date",

      "Category",

      "Payment Method",

      "Description",

      "Notes",
    ];


    const escapeCsvValue = (
      value
    ) => {

      const text =
        String(value ?? "");


      return `"${text.replace(
        /"/g,

        '""'
      )}"`;
    };


    const rows =
      filteredTransactions.map(
        (transaction) => {

          const {
            settledAmount,
            outstandingAmount,
          } = getTransactionValues(
            transaction
          );


          return [
            transaction.title,

            transaction.amount,

            transaction.direction,

            transaction.status,

            settledAmount,

            outstandingAmount,

            transaction.date,

            transaction.dueDate,

            transaction.categoryName,

            transaction.paymentMethod,

            transaction.description,

            transaction.notes,
          ].map(
            escapeCsvValue
          );
        }
      );


    const csvContent = [
      headers.map(
        escapeCsvValue
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


    link.href = url;


    link.download =
      selectedCategory
        ? `${selectedCategory.name
            .replace(
              /[^a-z0-9]/gi,
              "-"
            )
            .toLowerCase()}-report-${getLocalDateString()}.csv`

        : `moneyflow-report-${getLocalDateString()}.csv`;


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
  };


  /* =========================================================
     PDF EXPORT
     ========================================================= */

  const handleExportPdf = async () => {

    if (
      filteredTransactions.length === 0
    ) {
      setError(
        "There are no transactions matching the current filters to export."
      );

      return;
    }


    setExportingPdf(true);

    setError("");


    try {

      /* =====================================================
         CREATE LANDSCAPE A4 PDF
         ===================================================== */

      const doc = new jsPDF({
        orientation: "landscape",

        unit: "mm",

        format: "a4",
      });


      const pageWidth =
        doc.internal.pageSize.getWidth();


      const pageHeight =
        doc.internal.pageSize.getHeight();


      /* =====================================================
         COLOURS
         ===================================================== */

      const navy = [
        15,
        39,
        71,
      ];


      const green = [
        37,
        201,
        134,
      ];


      const softText = [
        100,
        116,
        139,
      ];


      const border = [
        226,
        232,
        240,
      ];


      const moneyInColour = [
        20,
        158,
        103,
      ];


      const moneyOutColour = [
        223,
        85,
        85,
      ];


      /* =====================================================
         SELECTED FILTER CATEGORY
         ===================================================== */

      const selectedFilterCategory =
        filters.categoryId
          ? categories.find(
              (category) =>
                category.id ===
                filters.categoryId
            )
          : null;


      /* =====================================================
         PERIOD DESCRIPTION
         ===================================================== */

      let periodDescription =
        PERIOD_LABELS[
          filters.period
        ] || "All time";


      if (
        filters.period === "custom"
      ) {

        const start =
          filters.startDate
            ? formatDate(
                filters.startDate
              )
            : "Beginning";


        const end =
          filters.endDate
            ? formatDate(
                filters.endDate
              )
            : "Today";


        periodDescription =
          `${start} to ${end}`;
      }


      /* =====================================================
         REPORT TITLE
         ===================================================== */

      const reportTitle =
        selectedFilterCategory
          ? `${selectedFilterCategory.name} Report`
          : "MoneyFlow Financial Report";


      /* =====================================================
         HEADER
         ===================================================== */

      doc.setFillColor(
        ...navy
      );


      doc.rect(
        0,
        0,
        pageWidth,
        35,
        "F"
      );


      doc.setTextColor(
        255,
        255,
        255
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(19);


      doc.text(
        "MoneyFlow",
        14,
        15
      );


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setFontSize(10);


      doc.setTextColor(
        220,
        230,
        240
      );


      doc.text(
        reportTitle,
        14,
        23
      );


      doc.setFontSize(8);


      doc.text(
        `Generated: ${new Intl.DateTimeFormat(
          "en-GB",
          {
            day: "numeric",

            month: "long",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit",
          }
        ).format(
          new Date()
        )}`,
        pageWidth - 14,
        15,
        {
          align: "right",
        }
      );


      doc.text(
        `${filteredTransactions.length} transaction${
          filteredTransactions.length === 1
            ? ""
            : "s"
        }`,
        pageWidth - 14,
        23,
        {
          align: "right",
        }
      );


      /* =====================================================
         APPLIED FILTERS
         ===================================================== */

      let currentY = 44;


      doc.setTextColor(
        ...navy
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(11);


      doc.text(
        "Applied Filters",
        14,
        currentY
      );


      currentY += 7;


      const filterItems = [
        [
          "Period",

          periodDescription,
        ],

        [
          "Direction",

          DIRECTION_LABELS[
            filters.direction
          ] || "Money In & Out",
        ],

        [
          "Status",

          FILTER_STATUS_LABELS[
            filters.status
          ] || "All statuses",
        ],

        [
          "Category",

          selectedFilterCategory?.name ||
            "All categories",
        ],
      ];


      autoTable(
        doc,
        {
          startY: currentY,

          body: filterItems,

          theme: "plain",

          margin: {
            left: 14,

            right: 14,
          },

          tableWidth: 115,

          styles: {
            fontSize: 8,

            cellPadding: {
              top: 2,

              right: 3,

              bottom: 2,

              left: 3,
            },

            textColor:
              softText,
          },

          columnStyles: {
            0: {
              fontStyle:
                "bold",

              textColor:
                navy,

              cellWidth: 26,
            },

            1: {
              cellWidth: 85,
            },
          },
        }
      );


      currentY =
        doc.lastAutoTable.finalY +
        8;


      /* =====================================================
         FINANCIAL SUMMARY
         ===================================================== */

      doc.setTextColor(
        ...navy
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(11);


      doc.text(
        "Financial Summary",
        14,
        currentY
      );


      currentY += 5;


      const summaryItems = [
        {
          label:
            "Total Money In",

          value:
            reportData
              .totalIncomingValue,

          colour:
            moneyInColour,
        },

        {
          label:
            "Total Money Out",

          value:
            reportData
              .totalOutgoingValue,

          colour:
            moneyOutColour,
        },

        {
          label:
            "Money Received",

          value:
            reportData.moneyReceived,

          colour:
            moneyInColour,
        },

        {
          label:
            "Money Paid",

          value:
            reportData.moneyPaid,

          colour:
            moneyOutColour,
        },

        {
          label:
            "To Receive",

          value:
            reportData.toReceive,

          colour:
            green,
        },

        {
          label:
            "To Pay",

          value:
            reportData.toPay,

          colour: [
            217,
            139,
            0,
          ],
        },

        {
          label:
            "Net Position",

          value:
            reportData.netPosition,

          colour:
            reportData.netPosition >= 0
              ? moneyInColour
              : moneyOutColour,
        },

        {
          label:
            "Transactions",

          value:
            reportData
              .totalTransactions,

          isCount: true,

          colour:
            navy,
        },
      ];


      const marginX = 14;


      const availableWidth =
        pageWidth -
        marginX * 2;


      const cardGap = 3;


      const cardsPerRow = 4;


      const cardWidth =
        (
          availableWidth -
          cardGap *
            (
              cardsPerRow -
              1
            )
        ) /
        cardsPerRow;


      const cardHeight = 19;


      summaryItems.forEach(
        (
          item,
          index
        ) => {

          const row =
            Math.floor(
              index /
                cardsPerRow
            );


          const column =
            index %
            cardsPerRow;


          const x =
            marginX +
            column *
              (
                cardWidth +
                cardGap
              );


          const y =
            currentY +
            row *
              (
                cardHeight +
                cardGap
              );


          doc.setFillColor(
            248,
            250,
            252
          );


          doc.setDrawColor(
            ...border
          );


          doc.roundedRect(
            x,
            y,
            cardWidth,
            cardHeight,
            2,
            2,
            "FD"
          );


          doc.setTextColor(
            ...softText
          );


          doc.setFont(
            "helvetica",
            "normal"
          );


          doc.setFontSize(7);


          doc.text(
            item.label,
            x + 4,
            y + 6
          );


          doc.setTextColor(
            ...item.colour
          );


          doc.setFont(
            "helvetica",
            "bold"
          );


          doc.setFontSize(11);


          const displayValue =
            item.isCount
              ? String(
                  item.value
                )
              : formatCurrency(
                  item.value
                );


          doc.text(
            displayValue,
            x + 4,
            y + 14
          );

        }
      );


      currentY +=
        (
          cardHeight * 2
        ) +
        cardGap +
        10;


      /* =====================================================
         TRANSACTIONS TABLE
         ===================================================== */

      doc.setTextColor(
        ...navy
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(11);


      doc.text(
        "Transactions",
        14,
        currentY
      );


      currentY += 4;


      const tableRows =
        filteredTransactions.map(
          (transaction) => {

            const {
              settledAmount,
              outstandingAmount,
            } =
              getTransactionValues(
                transaction
              );


            return [
              formatDate(
                transaction.date
              ),

              transaction.title ||
                "Untitled",

              transaction.categoryName ||
                "No category",

              transaction.direction ===
                "in"
                ? "Money In"
                : "Money Out",

              STATUS_LABELS[
                transaction.status
              ] ||
                transaction.status ||
                "Unknown",

              formatCurrency(
                transaction.amount
              ),

              formatCurrency(
                settledAmount
              ),

              formatCurrency(
                outstandingAmount
              ),

              transaction.dueDate
                ? formatDate(
                    transaction.dueDate
                  )
                : "—",

              PAYMENT_METHOD_LABELS[
                transaction.paymentMethod
              ] ||
                transaction.paymentMethod ||
                "—",
            ];
          }
        );


      autoTable(
        doc,
        {
          startY:
            currentY,

          head: [
            [
              "Date",

              "Transaction",

              "Category",

              "Direction",

              "Status",

              "Amount",

              "Settled",

              "Outstanding",

              "Due Date",

              "Payment",
            ],
          ],

          body:
            tableRows,

          theme:
            "grid",

          showHead:
            "everyPage",

          margin: {
            top: 16,

            right: 10,

            bottom: 16,

            left: 10,
          },

          styles: {
            font:
              "helvetica",

            fontSize: 6.7,

            cellPadding: 2,

            textColor: [
              51,
              65,
              85,
            ],

            lineColor:
              border,

            lineWidth: 0.1,

            overflow:
              "linebreak",

            valign:
              "middle",
          },

          headStyles: {
            fillColor:
              navy,

            textColor: [
              255,
              255,
              255,
            ],

            fontStyle:
              "bold",

            fontSize: 6.8,

            halign:
              "left",
          },

          alternateRowStyles: {
            fillColor: [
              248,
              250,
              252,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 22,
            },

            1: {
              cellWidth: 43,
            },

            2: {
              cellWidth: 32,
            },

            3: {
              cellWidth: 22,
            },

            4: {
              cellWidth: 24,
            },

            5: {
              cellWidth: 24,

              halign:
                "right",
            },

            6: {
              cellWidth: 24,

              halign:
                "right",
            },

            7: {
              cellWidth: 27,

              halign:
                "right",
            },

            8: {
              cellWidth: 22,
            },

            9: {
              cellWidth: 25,
            },
          },

          didParseCell: (
            tableData
          ) => {

            if (
              tableData.section !==
              "body"
            ) {
              return;
            }


            /* DIRECTION COLOUR */

            if (
              tableData.column.index ===
              3
            ) {

              if (
                tableData.cell.raw ===
                "Money In"
              ) {
                tableData.cell.styles.textColor =
                  moneyInColour;

                tableData.cell.styles.fontStyle =
                  "bold";
              }


              if (
                tableData.cell.raw ===
                "Money Out"
              ) {
                tableData.cell.styles.textColor =
                  moneyOutColour;

                tableData.cell.styles.fontStyle =
                  "bold";
              }

            }


            /* OUTSTANDING COLOUR */

            if (
              tableData.column.index ===
              7
            ) {

              const rawTransaction =
                filteredTransactions[
                  tableData.row.index
                ];


              const {
                outstandingAmount,
              } =
                getTransactionValues(
                  rawTransaction
                );


              if (
                outstandingAmount >
                0
              ) {
                tableData.cell.styles.textColor = [
                  217,
                  139,
                  0,
                ];

                tableData.cell.styles.fontStyle =
                  "bold";
              }

            }

          },
        }
      );


      /* =====================================================
         PAGE FOOTERS
         ===================================================== */

      const totalPages =
        doc.internal
          .getNumberOfPages();


      for (
        let pageNumber = 1;
        pageNumber <=
        totalPages;
        pageNumber += 1
      ) {

        doc.setPage(
          pageNumber
        );


        doc.setDrawColor(
          ...border
        );


        doc.line(
          10,
          pageHeight - 10,
          pageWidth - 10,
          pageHeight - 10
        );


        doc.setTextColor(
          ...softText
        );


        doc.setFont(
          "helvetica",
          "normal"
        );


        doc.setFontSize(7);


        doc.text(
          "MoneyFlow Financial Report",
          10,
          pageHeight - 5
        );


        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - 10,
          pageHeight - 5,
          {
            align: "right",
          }
        );

      }


      /* =====================================================
         FILE NAME
         ===================================================== */

      const safeCategoryName =
        selectedFilterCategory?.name
          ? selectedFilterCategory.name
              .trim()
              .replace(
                /[^a-z0-9]+/gi,
                "-"
              )
              .replace(
                /^-+|-+$/g,
                ""
              )
              .toLowerCase()
          : "";


      const periodFilePart =
        filters.period === "custom"
          ? "custom-period"
          : filters.period;


      const fileName =
        safeCategoryName
          ? `${safeCategoryName}-report-${periodFilePart}-${getLocalDateString()}.pdf`

          : `moneyflow-report-${periodFilePart}-${getLocalDateString()}.pdf`;


      /* =====================================================
         DOWNLOAD
         ===================================================== */

      doc.save(
        fileName
      );

    } catch (err) {

      console.error(
        "PDF export error:",
        err
      );


      setError(
        "Unable to generate the PDF report. Please try again."
      );

    } finally {

      setExportingPdf(false);

    }
  };


  /* =========================================================
     SUMMARY CARDS
     ========================================================= */

  const summaryCards = [
    {
      title: "Money Received",

      value:
        reportData.moneyReceived,

      description:
        "Actual money received",

      icon:
        ArrowDownLeft,

      className:
        "income",
    },

    {
      title: "Money Paid",

      value:
        reportData.moneyPaid,

      description:
        "Actual money paid out",

      icon:
        ArrowUpRight,

      className:
        "expense",
    },

    {
      title: "To Receive",

      value:
        reportData.toReceive,

      description:
        "Outstanding receivables",

      icon:
        CircleDollarSign,

      className:
        "receivable",
    },

    {
      title: "To Pay",

      value:
        reportData.toPay,

      description:
        "Outstanding payables",

      icon:
        Clock3,

      className:
        "payable",
    },
  ];


  return (

    <div className="reports-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="reports-header">

        <div>

          <p className="reports-eyebrow">
            Financial insights
          </p>


          <h1>
            Reports
          </h1>


          <p className="reports-description">
            Analyse all money in, money out and outstanding
            balances. Every category you create is automatically
            available for reporting and filtering.
          </p>

        </div>


        <div className="reports-header-actions">


          {/* CSV */}

          <button
            type="button"
            className="reports-export-button secondary"
            onClick={
              handleExportCsv
            }
            disabled={
              filteredTransactions.length === 0
            }
          >

            <FileSpreadsheet
              size={18}
              strokeWidth={2.1}
            />


            <span>
              Export CSV
            </span>

          </button>


          {/* PDF */}

          <button
            type="button"
            className="reports-export-button primary"
            onClick={
              handleExportPdf
            }
            disabled={
              filteredTransactions.length === 0 ||
              exportingPdf
            }
          >

            {exportingPdf ? (

              <Loader2
                size={18}
                strokeWidth={2.2}
                className="reports-spinner"
              />

            ) : (

              <Download
                size={18}
                strokeWidth={2.2}
              />

            )}


            <span>
              {exportingPdf
                ? "Generating PDF..."
                : "Export PDF"}
            </span>

          </button>

        </div>

      </header>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="reports-empty-state">

          <div className="reports-empty-icon">

            <ReceiptText
              size={30}
              strokeWidth={1.8}
            />

          </div>


          <h3>
            Unable to complete request
          </h3>


          <p>
            {error}
          </p>

        </div>

      )}


      {/* =====================================================
          FILTER CARD
          ===================================================== */}

      <section className="reports-filter-card">

        <div className="reports-filter-heading">

          <div>

            <div className="reports-filter-icon">

              <Filter
                size={19}
                strokeWidth={2.1}
              />

            </div>


            <div>

              <h2>
                Report filters
              </h2>


              <p>
                Filter transactions by date, direction,
                status or any category you have created.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="reports-reset-button"
            onClick={
              handleResetFilters
            }
          >

            <RefreshCw
              size={16}
              strokeWidth={2.1}
            />


            Reset filters

          </button>

        </div>


        {loading ? (

          <div className="reports-filters-loading">

            <Loader2
              size={20}
              className="reports-spinner"
            />


            <span>
              Loading reports...
            </span>

          </div>

        ) : (

          <div className="reports-filter-grid">


            {/* PERIOD */}

            <div className="reports-filter-field">

              <label htmlFor="report-period">
                Period
              </label>


              <select
                id="report-period"
                name="period"
                value={
                  filters.period
                }
                onChange={
                  handleFilterChange
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

                <option value="custom">
                  Custom dates
                </option>

              </select>

            </div>


            {/* DIRECTION */}

            <div className="reports-filter-field">

              <label htmlFor="report-direction">
                Direction
              </label>


              <select
                id="report-direction"
                name="direction"
                value={
                  filters.direction
                }
                onChange={
                  handleFilterChange
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


            {/* STATUS */}

            <div className="reports-filter-field">

              <label htmlFor="report-status">
                Status
              </label>


              <select
                id="report-status"
                name="status"
                value={
                  filters.status
                }
                onChange={
                  handleFilterChange
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


            {/* CATEGORY */}

            <div className="reports-filter-field">

              <label htmlFor="report-category">
                Category
              </label>


              <select
                id="report-category"
                name="categoryId"
                value={
                  filters.categoryId
                }
                onChange={
                  handleFilterChange
                }
              >

                <option value="">
                  All categories
                </option>


                {categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.name}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* CUSTOM START */}

            {filters.period ===
              "custom" && (

              <div className="reports-filter-field">

                <label htmlFor="report-start-date">
                  Start date
                </label>


                <div className="reports-date-input">

                  <CalendarDays
                    size={17}
                    strokeWidth={2}
                  />


                  <input
                    id="report-start-date"
                    name="startDate"
                    type="date"
                    value={
                      filters.startDate
                    }
                    onChange={
                      handleFilterChange
                    }
                  />

                </div>

              </div>

            )}


            {/* CUSTOM END */}

            {filters.period ===
              "custom" && (

              <div className="reports-filter-field">

                <label htmlFor="report-end-date">
                  End date
                </label>


                <div className="reports-date-input">

                  <CalendarDays
                    size={17}
                    strokeWidth={2}
                  />


                  <input
                    id="report-end-date"
                    name="endDate"
                    type="date"
                    value={
                      filters.endDate
                    }
                    onChange={
                      handleFilterChange
                    }
                  />

                </div>

              </div>

            )}

          </div>

        )}

      </section>


      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <section className="reports-summary-grid">

        {summaryCards.map(
          (card) => {

            const Icon =
              card.icon;


            return (

              <article
                key={card.title}
                className={
                  `reports-summary-card ${card.className}`
                }
              >

                <div
                  className={
                    `reports-summary-icon ${card.className}`
                  }
                >

                  <Icon
                    size={21}
                    strokeWidth={2.2}
                  />

                </div>


                <div className="reports-summary-content">

                  <span>
                    {card.title}
                  </span>


                  <strong>
                    {loading
                      ? "..."
                      : formatCurrency(
                          card.value
                        )}
                  </strong>


                  <p>
                    {card.description}
                  </p>

                </div>

              </article>

            );
          }
        )}

      </section>


      {/* =====================================================
          POSITION
          ===================================================== */}

      <section className="reports-position-grid">


        <article className="reports-position-card">

          <div className="reports-position-heading">

            <div>

              <p>
                Overall position
              </p>


              <h2>
                {selectedCategory
                  ? selectedCategory.name
                  : "Net financial position"}
              </h2>

            </div>


            <div className="reports-position-icon">

              <Wallet
                size={22}
                strokeWidth={2.1}
              />

            </div>

          </div>


          <strong className="reports-net-value">

            {loading
              ? "..."
              : formatCurrency(
                  reportData.netPosition
                )}

          </strong>


          <div className="reports-position-breakdown">


            <div>

              <span>
                Total Money In
              </span>


              <strong>
                {formatCurrency(
                  reportData
                    .totalIncomingValue
                )}
              </strong>

            </div>


            <div>

              <span>
                Total Money Out
              </span>


              <strong>
                {formatCurrency(
                  reportData
                    .totalOutgoingValue
                )}
              </strong>

            </div>

          </div>

        </article>


        <article className="reports-transaction-count-card">

          <div className="reports-position-heading">

            <div>

              <p>
                Activity
              </p>


              <h2>
                Transactions
              </h2>

            </div>


            <div className="reports-activity-icon">

              <ReceiptText
                size={22}
                strokeWidth={2.1}
              />

            </div>

          </div>


          <strong className="reports-count-value">

            {loading
              ? "..."
              : reportData
                  .totalTransactions}

          </strong>


          <span>
            Transactions matching the selected filters
          </span>

        </article>

      </section>


      {/* =====================================================
          REPORT TABS
          ===================================================== */}

      <section className="reports-main-card">


        <div className="reports-tabs">

          {REPORT_TABS.map(
            (tab) => {

              const Icon =
                tab.icon;


              return (

                <button
                  key={tab.id}
                  type="button"
                  className={
                    `reports-tab ${
                      activeTab === tab.id
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() => {

                    setActiveTab(
                      tab.id
                    );


                    if (
                      tab.id !==
                      "categories"
                    ) {
                      setSelectedCategoryId("");
                    }

                  }}
                >

                  <Icon
                    size={17}
                    strokeWidth={2.1}
                  />


                  <span>
                    {tab.label}
                  </span>

                </button>

              );
            }
          )}

        </div>


        {/* ===============================================
            OVERVIEW
            =============================================== */}

        {activeTab === "overview" && (

          reportData.totalTransactions ===
          0 ? (

            <div className="reports-empty-state">

              <div className="reports-empty-icon">

                <BarChart3
                  size={30}
                  strokeWidth={1.8}
                />

              </div>


              <h3>
                No financial data found
              </h3>


              <p>
                No transactions match the currently
                selected report filters.
              </p>

            </div>

          ) : (

            <div
              style={{
                padding: "20px",
              }}
            >

              <article className="reports-position-card">

                <div className="reports-position-heading">

                  <div>

                    <p>
                      Filtered results
                    </p>


                    <h2>
                      Financial overview
                    </h2>

                  </div>


                  <div className="reports-position-icon">

                    <BarChart3
                      size={22}
                      strokeWidth={2.1}
                    />

                  </div>

                </div>


                <div className="reports-position-breakdown">

                  <div>

                    <span>
                      Money received
                    </span>


                    <strong>
                      {formatCurrency(
                        reportData
                          .moneyReceived
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Money paid
                    </span>


                    <strong>
                      {formatCurrency(
                        reportData
                          .moneyPaid
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      To receive
                    </span>


                    <strong>
                      {formatCurrency(
                        reportData
                          .toReceive
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      To pay
                    </span>


                    <strong>
                      {formatCurrency(
                        reportData
                          .toPay
                      )}
                    </strong>

                  </div>

                </div>

              </article>

            </div>

          )

        )}


        {/* ===============================================
            CATEGORIES
            =============================================== */}

        {activeTab === "categories" &&
          !selectedCategory && (

          categoryBreakdown.length === 0 ? (

            <div className="reports-empty-state">

              <div className="reports-empty-icon">

                <Tag
                  size={30}
                  strokeWidth={1.8}
                />

              </div>


              <h3>
                No categories yet
              </h3>


              <p>
                Create categories first. Every category you add
                will automatically appear here.
              </p>

            </div>

          ) : (

            <div
              className="reports-summary-grid"
              style={{
                padding: "20px",

                marginBottom: 0,
              }}
            >

              {categoryBreakdown.map(
                (category) => (

                  <article
                    key={
                      category.id
                    }
                    className="reports-summary-card"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {

                      if (
                        event.key ===
                          "Enter" ||

                        event.key ===
                          " "
                      ) {
                        event.preventDefault();


                        handleCategoryClick(
                          category
                        );
                      }

                    }}
                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className="reports-summary-icon"
                      style={{
                        color:
                          category.color,

                        background:
                          `${category.color}18`,
                      }}
                    >

                      <Tag
                        size={21}
                        strokeWidth={2.2}
                      />

                    </div>


                    <div className="reports-summary-content">

                      <span>
                        {
                          category.transactionCount
                        }{" "}
                        {
                          category.transactionCount ===
                          1
                            ? "transaction"
                            : "transactions"
                        }
                      </span>


                      <strong>
                        {category.name}
                      </strong>


                      <p>
                        Net position:{" "}
                        {formatCurrency(
                          category.netPosition
                        )}
                      </p>

                    </div>


                    <div
                      className="reports-position-breakdown"
                      style={{
                        marginTop:
                          "18px",
                      }}
                    >

                      <div>

                        <span>
                          Total Money In
                        </span>


                        <strong>
                          {formatCurrency(
                            category.incoming
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Total Money Out
                        </span>


                        <strong>
                          {formatCurrency(
                            category.outgoing
                          )}
                        </strong>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )

        )}


        {/* ===============================================
            SELECTED CATEGORY DETAIL
            =============================================== */}

        {activeTab === "categories" &&
          selectedCategory && (

          <div
            style={{
              padding: "20px",
            }}
          >


            <button
              type="button"
              className="reports-reset-button"
              onClick={
                handleBackToCategories
              }
              style={{
                marginBottom:
                  "16px",
              }}
            >

              <ArrowLeft
                size={16}
                strokeWidth={2.2}
              />

              All categories

            </button>


            <article className="reports-position-card">

              <div className="reports-position-heading">

                <div>

                  <p>
                    Category report
                  </p>


                  <h2>
                    {
                      selectedCategory.name
                    }
                  </h2>

                </div>


                <div
                  className="reports-position-icon"
                  style={{
                    color:
                      selectedCategory.color,

                    background:
                      `${selectedCategory.color}18`,
                  }}
                >

                  <Tag
                    size={22}
                    strokeWidth={2.1}
                  />

                </div>

              </div>


              <div className="reports-position-breakdown">

                <div>

                  <span>
                    Total Money In
                  </span>


                  <strong>
                    {formatCurrency(
                      selectedCategory
                        .incoming
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Total Money Out
                  </span>


                  <strong>
                    {formatCurrency(
                      selectedCategory
                        .outgoing
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Net position
                  </span>


                  <strong>
                    {formatCurrency(
                      selectedCategory
                        .netPosition
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Transactions
                  </span>


                  <strong>
                    {
                      selectedCategory
                        .transactionCount
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    To receive
                  </span>


                  <strong>
                    {formatCurrency(
                      selectedCategory
                        .toReceive
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    To pay
                  </span>


                  <strong>
                    {formatCurrency(
                      selectedCategory
                        .toPay
                    )}
                  </strong>

                </div>

              </div>

            </article>


            <div
              className="reports-position-heading"
              style={{
                marginTop: "24px",

                marginBottom: "14px",
              }}
            >

              <div>

                <p>
                  Category activity
                </p>


                <h2>
                  All transactions
                </h2>

              </div>


              <div className="reports-activity-icon">

                <ReceiptText
                  size={22}
                  strokeWidth={2.1}
                />

              </div>

            </div>


            {selectedCategoryTransactions.length ===
            0 ? (

              <div className="reports-empty-state">

                <div className="reports-empty-icon">

                  <ReceiptText
                    size={30}
                    strokeWidth={1.8}
                  />

                </div>


                <h3>
                  No transactions in this category
                </h3>


                <p>
                  This category currently has no transactions
                  matching the selected date, direction and
                  status filters.
                </p>

              </div>

            ) : (

              <div
                className="reports-summary-grid"
                style={{
                  marginBottom: 0,
                }}
              >

                {selectedCategoryTransactions.map(
                  (transaction) => {

                    const isMoneyIn =
                      transaction.direction ===
                      "in";


                    const {
                      outstandingAmount,
                    } =
                      getTransactionValues(
                        transaction
                      );


                    return (

                      <article
                        key={
                          transaction.id
                        }
                        className={
                          `reports-summary-card ${
                            isMoneyIn
                              ? "income"
                              : "expense"
                          }`
                        }
                      >

                        <div
                          className={
                            `reports-summary-icon ${
                              isMoneyIn
                                ? "income"
                                : "expense"
                            }`
                          }
                        >

                          {isMoneyIn ? (

                            <ArrowDownLeft
                              size={21}
                              strokeWidth={2.2}
                            />

                          ) : (

                            <ArrowUpRight
                              size={21}
                              strokeWidth={2.2}
                            />

                          )}

                        </div>


                        <div className="reports-summary-content">

                          <span>
                            {isMoneyIn
                              ? "Money In"
                              : "Money Out"}
                          </span>


                          <strong>
                            {isMoneyIn
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              transaction.amount
                            )}
                          </strong>


                          <p>
                            {transaction.title}
                          </p>

                        </div>


                        <div
                          className="reports-position-breakdown"
                          style={{
                            marginTop:
                              "18px",
                          }}
                        >

                          <div>

                            <span>
                              Date
                            </span>


                            <strong>
                              {formatDate(
                                transaction.date
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Status
                            </span>


                            <strong>
                              {
                                STATUS_LABELS[
                                  transaction.status
                                ] ||
                                transaction.status ||
                                "Unknown"
                              }
                            </strong>

                          </div>


                          {transaction.paymentMethod && (

                            <div>

                              <span>
                                Payment method
                              </span>


                              <strong>
                                {
                                  PAYMENT_METHOD_LABELS[
                                    transaction.paymentMethod
                                  ] ||
                                  transaction.paymentMethod
                                }
                              </strong>

                            </div>

                          )}


                          {outstandingAmount >
                            0 && (

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

                          )}

                        </div>


                        {transaction.description && (

                          <p
                            style={{
                              margin:
                                "14px 0 0",

                              color:
                                "var(--mf-text-soft)",

                              fontSize:
                                "10.5px",

                              lineHeight:
                                1.6,
                            }}
                          >
                            {
                              transaction.description
                            }
                          </p>

                        )}

                      </article>

                    );
                  }
                )}

              </div>

            )}

          </div>

        )}


        {/* ===============================================
            OUTSTANDING
            =============================================== */}

        {activeTab === "outstanding" && (

          reportData.outstandingTransactions
            .length === 0 ? (

            <div className="reports-empty-state">

              <div className="reports-empty-icon">

                <Clock3
                  size={30}
                  strokeWidth={1.8}
                />

              </div>


              <h3>
                No outstanding transactions
              </h3>


              <p>
                No open or partially settled transactions
                match the currently selected filters.
              </p>

            </div>

          ) : (

            <div
              className="reports-summary-grid"
              style={{
                padding: "20px",

                marginBottom: 0,
              }}
            >

              {reportData.outstandingTransactions.map(
                (transaction) => {

                  const isMoneyIn =
                    transaction.direction ===
                    "in";


                  return (

                    <article
                      key={
                        transaction.id
                      }
                      className={
                        `reports-summary-card ${
                          isMoneyIn
                            ? "income"
                            : "expense"
                        }`
                      }
                    >

                      <div
                        className={
                          `reports-summary-icon ${
                            isMoneyIn
                              ? "income"
                              : "expense"
                          }`
                        }
                      >

                        {isMoneyIn ? (

                          <ArrowDownLeft
                            size={21}
                            strokeWidth={2.2}
                          />

                        ) : (

                          <ArrowUpRight
                            size={21}
                            strokeWidth={2.2}
                          />

                        )}

                      </div>


                      <div className="reports-summary-content">

                        <span>
                          {isMoneyIn
                            ? "To receive"
                            : "To pay"}
                        </span>


                        <strong>
                          {formatCurrency(
                            transaction
                              .calculatedOutstandingAmount
                          )}
                        </strong>


                        <p>
                          {transaction.title}

                          {transaction.categoryName
                            ? ` • ${transaction.categoryName}`
                            : ""}
                        </p>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )

        )}

      </section>

    </div>

  );
}


export default Reports;