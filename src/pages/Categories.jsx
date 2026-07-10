import "../styles/categories.css";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Edit3,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";


const DEFAULT_FORM = {
  name: "",
  description: "",
  direction: "both",
  color: "#25c986",
  isActive: true,
};


const CATEGORY_COLORS = [
  "#25c986",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef5f5f",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
  "#64748b",
  "#173d68",
];


function Categories() {
  const { currentUser } = useAuth();

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState(DEFAULT_FORM);


  /* =========================================================
     LOAD CATEGORIES
     ========================================================= */

  const loadCategories = async () => {
    if (!currentUser?.uid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const categoryList = await getCategories(currentUser.uid);

      setCategories(categoryList);
    } catch (err) {
      console.error("Load categories error:", err);

      setError(
        "Unable to load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCategories();
  }, [currentUser?.uid]);


  /* =========================================================
     FILTERED CATEGORIES
     ========================================================= */

  const filteredCategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return categories;
    }

    return categories.filter((category) => {
      const name = category.name?.toLowerCase() || "";

      const description =
        category.description?.toLowerCase() || "";

      return (
        name.includes(search) ||
        description.includes(search)
      );
    });
  }, [categories, searchTerm]);


  /* =========================================================
     OPEN ADD MODAL
     ========================================================= */

  const handleOpenAddModal = () => {
    setEditingCategory(null);

    setFormData(DEFAULT_FORM);

    setError("");
    setSuccessMessage("");

    setIsModalOpen(true);
  };


  /* =========================================================
     OPEN EDIT MODAL
     ========================================================= */

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      description: category.description || "",
      direction: category.direction || "both",
      color: category.color || "#25c986",
      isActive:
        typeof category.isActive === "boolean"
          ? category.isActive
          : true,
    });

    setError("");
    setSuccessMessage("");

    setIsModalOpen(true);
  };


  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(DEFAULT_FORM);
  };


  /* =========================================================
     FORM CHANGE
     ========================================================= */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };


  /* =========================================================
     SAVE CATEGORY
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.uid) {
      return;
    }

    const cleanName = formData.name.trim();

    if (!cleanName) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (editingCategory) {
        await updateCategory(
          currentUser.uid,
          editingCategory.id,
          {
            name: cleanName,
            description: formData.description,
            direction: formData.direction,
            color: formData.color,
            isActive: formData.isActive,
          }
        );

        setSuccessMessage(
          `"${cleanName}" has been updated.`
        );
      } else {
        await createCategory(currentUser.uid, {
          name: cleanName,
          description: formData.description,
          direction: formData.direction,
          color: formData.color,
          isActive: formData.isActive,
        });

        setSuccessMessage(
          `"${cleanName}" has been created.`
        );
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData(DEFAULT_FORM);

      await loadCategories();
    } catch (err) {
      console.error("Save category error:", err);

      setError(
        err.message ||
          "Unable to save the category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     DELETE CATEGORY
     ========================================================= */

  const handleDelete = async (category) => {
    if (!currentUser?.uid) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.name}" permanently?\n\n` +
        "This category will be completely removed."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteCategory(
        currentUser.uid,
        category.id
      );

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id
        )
      );

      setSuccessMessage(
        `"${category.name}" has been deleted.`
      );
    } catch (err) {
      console.error("Delete category error:", err);

      setError(
        "Unable to delete this category. Please try again."
      );
    } finally {
      setDeletingId("");
    }
  };


  /* =========================================================
     DIRECTION LABEL
     ========================================================= */

  const getDirectionDetails = (direction) => {
    if (direction === "in") {
      return {
        label: "Money In",
        className: "money-in",
        icon: ArrowDownLeft,
      };
    }

    if (direction === "out") {
      return {
        label: "Money Out",
        className: "money-out",
        icon: ArrowUpRight,
      };
    }

    return {
      label: "Money In & Out",
      className: "both",
      icon: Tag,
    };
  };


  return (
    <div className="categories-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="categories-header">

        <div>
          <p className="categories-eyebrow">
            Organisation
          </p>

          <h1>Categories</h1>

          <p className="categories-description">
            Create your own flexible categories for personal
            expenses, rent, repairs, cleaning, advertising,
            utilities or anything else you want to track.
          </p>
        </div>


        <button
          type="button"
          className="categories-add-button"
          onClick={handleOpenAddModal}
        >
          <Plus size={19} strokeWidth={2.4} />

          <span>Add category</span>
        </button>

      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && !isModalOpen && (
        <div className="categories-message error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="categories-message success">

          <Check size={18} strokeWidth={2.3} />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <section className="categories-summary">

        <div className="categories-summary-item">
          <span>Total categories</span>

          <strong>{categories.length}</strong>
        </div>


        <div className="categories-summary-item">
          <span>Active</span>

          <strong className="active-total">
            {
              categories.filter(
                (category) => category.isActive !== false
              ).length
            }
          </strong>
        </div>


        <div className="categories-summary-item">
          <span>Money In</span>

          <strong className="money-in-total">
            {
              categories.filter(
                (category) => category.direction === "in"
              ).length
            }
          </strong>
        </div>


        <div className="categories-summary-item">
          <span>Money Out</span>

          <strong className="money-out-total">
            {
              categories.filter(
                (category) => category.direction === "out"
              ).length
            }
          </strong>
        </div>

      </section>


      {/* =====================================================
          SEARCH
          ===================================================== */}

      <section className="categories-toolbar">

        <div className="categories-search">

          <Search size={18} strokeWidth={2} />

          <input
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

        </div>

      </section>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      {loading ? (

        <section className="categories-loading">

          <Loader2
            size={30}
            strokeWidth={2}
            className="categories-spinner"
          />

          <p>Loading categories...</p>

        </section>

      ) : filteredCategories.length === 0 ? (

        <section className="categories-empty-state">

          <div className="categories-empty-icon">
            <Tag size={30} strokeWidth={1.8} />
          </div>

          <h2>
            {searchTerm
              ? "No matching categories"
              : "No categories yet"}
          </h2>

          <p>
            {searchTerm
              ? "Try a different search term."
              : "Create your first category and use it to organise transactions however you want."}
          </p>


          {!searchTerm && (
            <button
              type="button"
              className="categories-empty-button"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} strokeWidth={2.4} />

              Add first category
            </button>
          )}

        </section>

      ) : (

        <section className="categories-grid">

          {filteredCategories.map((category) => {
            const direction =
              getDirectionDetails(category.direction);

            const DirectionIcon = direction.icon;

            const isDeleting =
              deletingId === category.id;

            return (
              <article
                key={category.id}
                className={`category-card ${
                  category.isActive === false
                    ? "inactive"
                    : ""
                }`}
              >

                <div className="category-card-top">

                  <div
                    className="category-card-icon"
                    style={{
                      "--category-color":
                        category.color || "#25c986",
                    }}
                  >
                    <Tag size={21} strokeWidth={2.1} />
                  </div>


                  <div className="category-card-actions">

                    <button
                      type="button"
                      className="category-card-action edit"
                      onClick={() =>
                        handleOpenEditModal(category)
                      }
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit3 size={16} strokeWidth={2} />
                    </button>


                    <button
                      type="button"
                      className="category-card-action delete"
                      onClick={() =>
                        handleDelete(category)
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${category.name}`}
                    >
                      {isDeleting ? (
                        <Loader2
                          size={16}
                          className="categories-spinner"
                        />
                      ) : (
                        <Trash2
                          size={16}
                          strokeWidth={2}
                        />
                      )}
                    </button>

                  </div>

                </div>


                <div className="category-card-content">

                  <div className="category-card-title-row">

                    <h2>{category.name}</h2>

                    {category.isActive === false && (
                      <span className="category-inactive-badge">
                        Inactive
                      </span>
                    )}

                  </div>


                  <p>
                    {category.description ||
                      "No description added."}
                  </p>

                </div>


                <div className="category-card-footer">

                  <span
                    className={`category-direction-badge ${direction.className}`}
                  >
                    <DirectionIcon
                      size={14}
                      strokeWidth={2.2}
                    />

                    {direction.label}
                  </span>

                </div>

              </article>
            );
          })}

        </section>

      )}


      {/* =====================================================
          MODAL
          ===================================================== */}

      {isModalOpen && (

        <div
          className="category-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >

          <div
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >

            <div className="category-modal-header">

              <div>
                <p>
                  {editingCategory
                    ? "Update category"
                    : "New category"}
                </p>

                <h2 id="category-modal-title">
                  {editingCategory
                    ? "Edit category"
                    : "Add category"}
                </h2>
              </div>


              <button
                type="button"
                className="category-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="category-modal-form"
              onSubmit={handleSubmit}
            >

              {error && (
                <div className="category-modal-error">
                  {error}
                </div>
              )}


              {/* NAME */}

              <div className="category-form-field">

                <label htmlFor="category-name">
                  Category name
                  <span>*</span>
                </label>

                <input
                  id="category-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Building Repairs"
                  value={formData.name}
                  onChange={handleChange}
                  autoFocus
                  required
                />

              </div>


              {/* DESCRIPTION */}

              <div className="category-form-field">

                <label htmlFor="category-description">
                  Description
                  <small>Optional</small>
                </label>

                <textarea
                  id="category-description"
                  name="description"
                  rows="3"
                  placeholder="Add an optional description..."
                  value={formData.description}
                  onChange={handleChange}
                />

              </div>


              {/* DIRECTION */}

              <div className="category-form-field">

                <label>
                  Transaction direction
                </label>

                <div className="category-direction-options">

                  <button
                    type="button"
                    className={`category-direction-option ${
                      formData.direction === "both"
                        ? "active both"
                        : ""
                    }`}
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        direction: "both",
                      }))
                    }
                  >
                    <Tag size={18} />
                    <span>Both</span>
                  </button>


                  <button
                    type="button"
                    className={`category-direction-option ${
                      formData.direction === "in"
                        ? "active money-in"
                        : ""
                    }`}
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        direction: "in",
                      }))
                    }
                  >
                    <ArrowDownLeft size={18} />
                    <span>Money In</span>
                  </button>


                  <button
                    type="button"
                    className={`category-direction-option ${
                      formData.direction === "out"
                        ? "active money-out"
                        : ""
                    }`}
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        direction: "out",
                      }))
                    }
                  >
                    <ArrowUpRight size={18} />
                    <span>Money Out</span>
                  </button>

                </div>

              </div>


              {/* COLOUR */}

              <div className="category-form-field">

                <label>
                  Category colour
                </label>

                <div className="category-color-options">

                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`category-color-option ${
                        formData.color === color
                          ? "active"
                          : ""
                      }`}
                      style={{
                        backgroundColor: color,
                      }}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          color,
                        }))
                      }
                      aria-label={`Select ${color}`}
                    >
                      {formData.color === color && (
                        <Check
                          size={15}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  ))}

                </div>

              </div>


              {/* ACTIVE */}

              <label className="category-active-toggle">

                <div>
                  <strong>Active category</strong>

                  <span>
                    Active categories can be selected when
                    adding transactions.
                  </span>
                </div>


                <span className="category-toggle-control">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />

                  <span className="category-toggle-slider">
                  </span>

                </span>

              </label>


              {/* ACTIONS */}

              <div className="category-modal-actions">

                <button
                  type="button"
                  className="category-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="category-modal-save"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="categories-spinner"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                        strokeWidth={2.4}
                      />

                      {editingCategory
                        ? "Save changes"
                        : "Create category"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Categories;