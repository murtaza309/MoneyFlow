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
 * Returns the categories collection for a specific user.
 */
function getCategoriesCollection(userId) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  return collection(db, "users", userId, "categories");
}


/**
 * Get all categories belonging to a user.
 */
export async function getCategories(userId) {
  const categoriesRef = getCategoriesCollection(userId);

  const categoriesQuery = query(
    categoriesRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(categoriesQuery);

  return snapshot.docs.map((categoryDoc) => ({
    id: categoryDoc.id,
    ...categoryDoc.data(),
  }));
}


/**
 * Create a new category.
 */
export async function createCategory(userId, categoryData) {
  const categoriesRef = getCategoriesCollection(userId);

  const cleanName = categoryData.name?.trim();

  if (!cleanName) {
    throw new Error("Category name is required.");
  }

  const newCategory = {
    name: cleanName,

    description: categoryData.description?.trim() || "",

    direction:
      categoryData.direction === "in" ||
      categoryData.direction === "out"
        ? categoryData.direction
        : "both",

    color: categoryData.color || "#25c986",

    icon: categoryData.icon || "tag",

    isActive:
      typeof categoryData.isActive === "boolean"
        ? categoryData.isActive
        : true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentReference = await addDoc(
    categoriesRef,
    newCategory
  );

  return documentReference.id;
}


/**
 * Update an existing category.
 */
export async function updateCategory(
  userId,
  categoryId,
  categoryData
) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!categoryId) {
    throw new Error("A valid category ID is required.");
  }

  const categoryRef = doc(
    db,
    "users",
    userId,
    "categories",
    categoryId
  );

  const updatedData = {
    ...categoryData,
    updatedAt: serverTimestamp(),
  };

  if (typeof updatedData.name === "string") {
    updatedData.name = updatedData.name.trim();

    if (!updatedData.name) {
      throw new Error("Category name cannot be empty.");
    }
  }

  if (typeof updatedData.description === "string") {
    updatedData.description = updatedData.description.trim();
  }

  await updateDoc(categoryRef, updatedData);
}


/**
 * Permanently delete a category.
 *
 * Important:
 * This only deletes the category record itself.
 * Later, before deletion, the UI will check whether transactions
 * are linked to the category and let the user decide what to do.
 */
export async function deleteCategory(userId, categoryId) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  if (!categoryId) {
    throw new Error("A valid category ID is required.");
  }

  const categoryRef = doc(
    db,
    "users",
    userId,
    "categories",
    categoryId
  );

  await deleteDoc(categoryRef);
}