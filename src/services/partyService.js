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


/**
 * Return the parties collection belonging to a specific user.
 */
function getPartiesCollection(userId) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  return collection(
    db,
    "users",
    userId,
    "parties"
  );
}


/**
 * Get all people and companies belonging to a user.
 */
export async function getParties(userId) {
  const partiesRef = getPartiesCollection(userId);

  const partiesQuery = query(
    partiesRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(partiesQuery);

  return snapshot.docs.map((partyDoc) => ({
    id: partyDoc.id,
    ...partyDoc.data(),
  }));
}


/**
 * Create a new person or company.
 */
export async function createParty(userId, partyData) {
  const partiesRef = getPartiesCollection(userId);

  const cleanName = partyData.name?.trim();

  if (!cleanName) {
    throw new Error("Name is required.");
  }

  const validTypes = [
    "person",
    "company",
    "tenant",
    "supplier",
    "contractor",
    "employee",
    "customer",
    "other",
  ];

  const type = validTypes.includes(partyData.type)
    ? partyData.type
    : "person";

  const newParty = {
    name: cleanName,

    type,

    phone: partyData.phone?.trim() || "",

    email: partyData.email?.trim() || "",

    address: partyData.address?.trim() || "",

    description:
      partyData.description?.trim() || "",

    notes: partyData.notes?.trim() || "",

    isActive:
      typeof partyData.isActive === "boolean"
        ? partyData.isActive
        : true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentReference = await addDoc(
    partiesRef,
    newParty
  );

  return documentReference.id;
}


/**
 * Update an existing person or company.
 */
export async function updateParty(
  userId,
  partyId,
  partyData
) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!partyId) {
    throw new Error("A valid party ID is required.");
  }

  const partyRef = doc(
    db,
    "users",
    userId,
    "parties",
    partyId
  );

  const updatedData = {
    ...partyData,
    updatedAt: serverTimestamp(),
  };

  if (typeof updatedData.name === "string") {
    updatedData.name = updatedData.name.trim();

    if (!updatedData.name) {
      throw new Error("Name cannot be empty.");
    }
  }

  if (typeof updatedData.phone === "string") {
    updatedData.phone = updatedData.phone.trim();
  }

  if (typeof updatedData.email === "string") {
    updatedData.email = updatedData.email.trim();
  }

  if (typeof updatedData.address === "string") {
    updatedData.address = updatedData.address.trim();
  }

  if (typeof updatedData.description === "string") {
    updatedData.description =
      updatedData.description.trim();
  }

  if (typeof updatedData.notes === "string") {
    updatedData.notes = updatedData.notes.trim();
  }

  await updateDoc(
    partyRef,
    updatedData
  );
}


/**
 * Permanently delete a person or company record.
 *
 * Important:
 * This currently deletes only the party record itself.
 * Before transactions are connected, that is safe.
 *
 * Later, once transactions exist, we will show options:
 *
 * 1. Delete party but keep transactions unassigned.
 * 2. Reassign transactions to another party.
 * 3. Delete party and all linked financial records.
 */
export async function deleteParty(
  userId,
  partyId
) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!partyId) {
    throw new Error("A valid party ID is required.");
  }

  const partyRef = doc(
    db,
    "users",
    userId,
    "parties",
    partyId
  );

  await deleteDoc(partyRef);
}