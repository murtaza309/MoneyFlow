import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";


/* =========================================================
   TRANSACTIONS COLLECTION
   ========================================================= */

function getTransactionsCollection(userId) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  return collection(
    db,
    "users",
    userId,
    "transactions"
  );
}


/* =========================================================
   GET ALL TRANSACTIONS
   ========================================================= */

export async function getTransactions(userId) {
  const transactionsRef =
    getTransactionsCollection(userId);

  const transactionsQuery = query(
    transactionsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(
    transactionsQuery
  );

  return snapshot.docs.map((transactionDoc) => ({
    id: transactionDoc.id,
    ...transactionDoc.data(),
  }));
}


/* =========================================================
   CREATE TRANSACTION
   ========================================================= */

export async function createTransaction(
  userId,
  transactionData
) {
  const transactionsRef =
    getTransactionsCollection(userId);

  const cleanTitle =
    transactionData.title?.trim();

  if (!cleanTitle) {
    throw new Error(
      "Transaction title is required."
    );
  }

  const amount = Number(
    transactionData.amount
  );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Please enter a valid transaction amount."
    );
  }


  /* -------------------------------------------------------
     VALID DIRECTION
     ------------------------------------------------------- */

  const direction =
    transactionData.direction === "in"
      ? "in"
      : "out";


  /* -------------------------------------------------------
     VALID STATUS
     ------------------------------------------------------- */

  const validStatuses = [
    "cleared",
    "open",
    "partial",
  ];

  const status = validStatuses.includes(
    transactionData.status
  )
    ? transactionData.status
    : "cleared";


  /* -------------------------------------------------------
     SETTLEMENT VALUES

     Cleared:
       Entire amount is settled.

     Open:
       Nothing is settled.

     Partial:
       Use settledAmount supplied by the form.
     ------------------------------------------------------- */

  let settledAmount = 0;

  if (status === "cleared") {
    settledAmount = amount;
  }

  if (status === "partial") {
    settledAmount = Number(
      transactionData.settledAmount
    );

    if (
      !Number.isFinite(settledAmount) ||
      settledAmount <= 0 ||
      settledAmount >= amount
    ) {
      throw new Error(
        "For a partially settled transaction, the settled amount must be greater than £0 and less than the total amount."
      );
    }
  }

  const outstandingAmount =
    amount - settledAmount;


  /* -------------------------------------------------------
     OPTIONAL SNAPSHOT DATA

     We store both IDs and display names.

     Why?
     If a category, person, company or property is later deleted,
     the historical transaction can still retain the name that was
     originally attached to it.
     ------------------------------------------------------- */

  const newTransaction = {
    title: cleanTitle,

    amount,

    direction,

    status,

    settledAmount,

    outstandingAmount,


    /* DATE */

    date:
      transactionData.date || "",

    dueDate:
      transactionData.dueDate || "",


    /* PARTY */

    partyId:
      transactionData.partyId || "",

    partyName:
      transactionData.partyName?.trim() || "",

    partyType:
      transactionData.partyType || "",


    /* CATEGORY */

    categoryId:
      transactionData.categoryId || "",

    categoryName:
      transactionData.categoryName?.trim() || "",

    categoryColor:
      transactionData.categoryColor || "",


    /* PROPERTY */

    propertyId:
      transactionData.propertyId || "",

    propertyName:
      transactionData.propertyName?.trim() || "",

    propertyNumber:
      transactionData.propertyNumber?.trim() || "",


    /* PAYMENT DETAILS */

    paymentMethod:
      transactionData.paymentMethod || "",


    /* OPTIONAL TEXT */

    description:
      transactionData.description?.trim() || "",

    notes:
      transactionData.notes?.trim() || "",


    /* SYSTEM FIELDS */

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  };


  const documentReference = await addDoc(
    transactionsRef,
    newTransaction
  );

  return documentReference.id;
}


/* =========================================================
   UPDATE TRANSACTION
   ========================================================= */

export async function updateTransaction(
  userId,
  transactionId,
  transactionData
) {
  if (!userId) {
    throw new Error(
      "A valid user ID is required."
    );
  }

  if (!transactionId) {
    throw new Error(
      "A valid transaction ID is required."
    );
  }


  const transactionRef = doc(
    db,
    "users",
    userId,
    "transactions",
    transactionId
  );


  const updatedData = {
    ...transactionData,

    updatedAt: serverTimestamp(),
  };


  /* -------------------------------------------------------
     CLEAN TITLE
     ------------------------------------------------------- */

  if (
    typeof updatedData.title === "string"
  ) {
    updatedData.title =
      updatedData.title.trim();

    if (!updatedData.title) {
      throw new Error(
        "Transaction title cannot be empty."
      );
    }
  }


  /* -------------------------------------------------------
     VALIDATE AMOUNT
     ------------------------------------------------------- */

  if (
    updatedData.amount !== undefined
  ) {
    const amount = Number(
      updatedData.amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Please enter a valid transaction amount."
      );
    }

    updatedData.amount = amount;
  }


  /* -------------------------------------------------------
     CLEAN OPTIONAL TEXT
     ------------------------------------------------------- */

  if (
    typeof updatedData.partyName === "string"
  ) {
    updatedData.partyName =
      updatedData.partyName.trim();
  }

  if (
    typeof updatedData.categoryName === "string"
  ) {
    updatedData.categoryName =
      updatedData.categoryName.trim();
  }

  if (
    typeof updatedData.propertyName === "string"
  ) {
    updatedData.propertyName =
      updatedData.propertyName.trim();
  }

  if (
    typeof updatedData.propertyNumber === "string"
  ) {
    updatedData.propertyNumber =
      updatedData.propertyNumber.trim();
  }

  if (
    typeof updatedData.description === "string"
  ) {
    updatedData.description =
      updatedData.description.trim();
  }

  if (
    typeof updatedData.notes === "string"
  ) {
    updatedData.notes =
      updatedData.notes.trim();
  }


  await updateDoc(
    transactionRef,
    updatedData
  );
}


/* =========================================================
   DELETE TRANSACTION PERMANENTLY
   ========================================================= */

export async function deleteTransaction(
  userId,
  transactionId
) {
  if (!userId) {
    throw new Error(
      "A valid user ID is required."
    );
  }

  if (!transactionId) {
    throw new Error(
      "A valid transaction ID is required."
    );
  }


  const transactionRef = doc(
    db,
    "users",
    userId,
    "transactions",
    transactionId
  );


  await deleteDoc(transactionRef);
}