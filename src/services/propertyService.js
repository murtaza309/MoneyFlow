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
 * Return the properties collection belonging to a specific user.
 */
function getPropertiesCollection(userId) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  return collection(
    db,
    "users",
    userId,
    "properties"
  );
}


/**
 * Get all properties belonging to a user.
 */
export async function getProperties(userId) {
  const propertiesRef = getPropertiesCollection(userId);

  const propertiesQuery = query(
    propertiesRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(propertiesQuery);

  return snapshot.docs.map((propertyDoc) => ({
    id: propertyDoc.id,
    ...propertyDoc.data(),
  }));
}


/**
 * Create a new property.
 */
export async function createProperty(
  userId,
  propertyData
) {
  const propertiesRef =
    getPropertiesCollection(userId);

  const cleanName =
    propertyData.name?.trim();

  if (!cleanName) {
    throw new Error("Property name is required.");
  }

  const newProperty = {
    name: cleanName,

    propertyNumber:
      propertyData.propertyNumber?.trim() || "",

    address:
      propertyData.address?.trim() || "",

    description:
      propertyData.description?.trim() || "",

    notes:
      propertyData.notes?.trim() || "",

    isActive:
      typeof propertyData.isActive === "boolean"
        ? propertyData.isActive
        : true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentReference = await addDoc(
    propertiesRef,
    newProperty
  );

  return documentReference.id;
}


/**
 * Update an existing property.
 */
export async function updateProperty(
  userId,
  propertyId,
  propertyData
) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!propertyId) {
    throw new Error("A valid property ID is required.");
  }

  const propertyRef = doc(
    db,
    "users",
    userId,
    "properties",
    propertyId
  );

  const updatedData = {
    ...propertyData,
    updatedAt: serverTimestamp(),
  };

  if (typeof updatedData.name === "string") {
    updatedData.name = updatedData.name.trim();

    if (!updatedData.name) {
      throw new Error(
        "Property name cannot be empty."
      );
    }
  }

  if (
    typeof updatedData.propertyNumber === "string"
  ) {
    updatedData.propertyNumber =
      updatedData.propertyNumber.trim();
  }

  if (typeof updatedData.address === "string") {
    updatedData.address =
      updatedData.address.trim();
  }

  if (
    typeof updatedData.description === "string"
  ) {
    updatedData.description =
      updatedData.description.trim();
  }

  if (typeof updatedData.notes === "string") {
    updatedData.notes =
      updatedData.notes.trim();
  }

  await updateDoc(
    propertyRef,
    updatedData
  );
}


/**
 * Permanently delete a property record.
 *
 * Later, once transactions are linked to properties,
 * we will protect this action and let the user choose:
 *
 * 1. Delete property but keep transactions unassigned.
 * 2. Reassign linked transactions.
 * 3. Delete property and all linked financial records.
 */
export async function deleteProperty(
  userId,
  propertyId
) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!propertyId) {
    throw new Error("A valid property ID is required.");
  }

  const propertyRef = doc(
    db,
    "users",
    userId,
    "properties",
    propertyId
  );

  await deleteDoc(propertyRef);
}