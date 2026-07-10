import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";


/* =========================================================
   DEFAULT MONEYFLOW SETTINGS
   ========================================================= */

export const DEFAULT_USER_SETTINGS = {

  /* -------------------------------------------------------
     PROFILE
     ------------------------------------------------------- */

  profile: {
    displayName: "",
  },


  /* -------------------------------------------------------
     MONEY PREFERENCES
     ------------------------------------------------------- */

  money: {
    currency: "GBP",

    currencySymbol: "£",

    currencyPosition: "before",

    numberFormat: "en-GB",

    decimalPlaces: 2,
  },


  /* -------------------------------------------------------
     TRANSACTION DEFAULTS
     ------------------------------------------------------- */

  transactionDefaults: {
    direction: "out",

    status: "cleared",

    paymentMethod: "",

    requireCategory: true,

    rememberLastCategory: false,
  },


  /* -------------------------------------------------------
     DISPLAY PREFERENCES
     ------------------------------------------------------- */

  display: {
    weekStartsOn: "monday",

    recentTransactionsCount: 5,

    showInactiveCategories: false,

    compactTransactionCards: false,

    showTransactionDescriptions: true,

    showPaymentMethods: true,

    showDueDates: true,
  },


  /* -------------------------------------------------------
     REPORT PREFERENCES
     ------------------------------------------------------- */

  reports: {
    defaultPeriod: "all",

    defaultDirection: "all",

    defaultStatus: "all",

    includeZeroValueCategories: true,
  },


  /* -------------------------------------------------------
     NOTIFICATIONS
     ------------------------------------------------------- */

  notifications: {
    dueDateReminders: true,

    overdueReminders: true,

    reminderDaysBefore: 3,
  },
};


/* =========================================================
   SETTINGS DOCUMENT
   ========================================================= */

function getSettingsDocument(userId) {
  if (!userId) {
    throw new Error(
      "A valid user ID is required."
    );
  }


  return doc(
    db,
    "users",
    userId,
    "settings",
    "preferences"
  );
}


/* =========================================================
   DEEP MERGE HELPER

   Ensures that when new settings are added later,
   older users automatically receive the new defaults.
   ========================================================= */

function deepMerge(defaults, saved) {
  const result = {
    ...defaults,
  };


  Object.keys(defaults).forEach((key) => {

    const defaultValue =
      defaults[key];


    const savedValue =
      saved?.[key];


    if (
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      result[key] = deepMerge(
        defaultValue,
        savedValue || {}
      );

      return;
    }


    if (
      savedValue !== undefined
    ) {
      result[key] = savedValue;
    }

  });


  return result;
}


/* =========================================================
   GET SETTINGS
   ========================================================= */

export async function getUserSettings(
  userId
) {
  const settingsRef =
    getSettingsDocument(userId);


  const snapshot =
    await getDoc(settingsRef);


  if (!snapshot.exists()) {
    return {
      ...DEFAULT_USER_SETTINGS,
    };
  }


  const savedSettings =
    snapshot.data();


  return deepMerge(
    DEFAULT_USER_SETTINGS,
    savedSettings
  );
}


/* =========================================================
   SAVE ALL SETTINGS
   ========================================================= */

export async function saveUserSettings(
  userId,
  settings
) {
  if (!settings) {
    throw new Error(
      "Settings data is required."
    );
  }


  const settingsRef =
    getSettingsDocument(userId);


  await setDoc(
    settingsRef,

    {
      ...settings,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge: true,
    }
  );
}


/* =========================================================
   SAVE ONE SETTINGS SECTION

   Example:

   saveSettingsSection(
     userId,
     "money",
     {
       currency: "USD",
       currencySymbol: "$"
     }
   )
   ========================================================= */

export async function saveSettingsSection(
  userId,
  sectionName,
  sectionData
) {
  if (!sectionName) {
    throw new Error(
      "Settings section name is required."
    );
  }


  if (
    !sectionData ||
    typeof sectionData !== "object"
  ) {
    throw new Error(
      "Valid settings section data is required."
    );
  }


  const settingsRef =
    getSettingsDocument(userId);


  await setDoc(
    settingsRef,

    {
      [sectionName]: sectionData,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge: true,
    }
  );
}


/* =========================================================
   RESET SETTINGS TO DEFAULTS
   ========================================================= */

export async function resetUserSettings(
  userId
) {
  const settingsRef =
    getSettingsDocument(userId);


  await setDoc(
    settingsRef,

    {
      ...DEFAULT_USER_SETTINGS,

      updatedAt:
        serverTimestamp(),
    },

    {
      merge: false,
    }
  );


  return {
    ...DEFAULT_USER_SETTINGS,
  };
}