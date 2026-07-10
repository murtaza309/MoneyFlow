import "../styles/properties.css";

import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  Check,
  Edit3,
  Hash,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  createProperty,
  deleteProperty,
  getProperties,
  updateProperty,
} from "../services/propertyService";


const DEFAULT_FORM = {
  name: "",
  propertyNumber: "",
  address: "",
  description: "",
  notes: "",
  isActive: true,
};


function Properties() {
  const { currentUser } = useAuth();

  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const [formData, setFormData] = useState(DEFAULT_FORM);


  /* =========================================================
     LOAD PROPERTIES
     ========================================================= */

  const loadProperties = async () => {
    if (!currentUser?.uid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const propertyList = await getProperties(
        currentUser.uid
      );

      setProperties(propertyList);
    } catch (err) {
      console.error("Load properties error:", err);

      setError(
        "Unable to load properties. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadProperties();
  }, [currentUser?.uid]);


  /* =========================================================
     FILTERED PROPERTIES
     ========================================================= */

  const filteredProperties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return properties;
    }

    return properties.filter((property) => {
      const name =
        property.name?.toLowerCase() || "";

      const propertyNumber =
        property.propertyNumber?.toLowerCase() || "";

      const address =
        property.address?.toLowerCase() || "";

      const description =
        property.description?.toLowerCase() || "";

      return (
        name.includes(search) ||
        propertyNumber.includes(search) ||
        address.includes(search) ||
        description.includes(search)
      );
    });
  }, [properties, searchTerm]);


  /* =========================================================
     OPEN ADD MODAL
     ========================================================= */

  const handleOpenAddModal = () => {
    setEditingProperty(null);
    setFormData(DEFAULT_FORM);

    setError("");
    setSuccessMessage("");

    setIsModalOpen(true);
  };


  /* =========================================================
     OPEN EDIT MODAL
     ========================================================= */

  const handleOpenEditModal = (property) => {
    setEditingProperty(property);

    setFormData({
      name: property.name || "",
      propertyNumber: property.propertyNumber || "",
      address: property.address || "",
      description: property.description || "",
      notes: property.notes || "",

      isActive:
        typeof property.isActive === "boolean"
          ? property.isActive
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
    setEditingProperty(null);
    setFormData(DEFAULT_FORM);
    setError("");
  };


  /* =========================================================
     FORM CHANGE
     ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  /* =========================================================
     SAVE PROPERTY
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.uid) {
      return;
    }

    const cleanName = formData.name.trim();

    if (!cleanName) {
      setError("Please enter a property name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const propertyPayload = {
        name: cleanName,
        propertyNumber: formData.propertyNumber,
        address: formData.address,
        description: formData.description,
        notes: formData.notes,
        isActive: formData.isActive,
      };

      if (editingProperty) {
        await updateProperty(
          currentUser.uid,
          editingProperty.id,
          propertyPayload
        );

        setSuccessMessage(
          `"${cleanName}" has been updated.`
        );
      } else {
        await createProperty(
          currentUser.uid,
          propertyPayload
        );

        setSuccessMessage(
          `"${cleanName}" has been added.`
        );
      }

      setIsModalOpen(false);
      setEditingProperty(null);
      setFormData(DEFAULT_FORM);

      await loadProperties();
    } catch (err) {
      console.error("Save property error:", err);

      setError(
        err.message ||
          "Unable to save this property. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     DELETE PROPERTY
     ========================================================= */

  const handleDelete = async (property) => {
    if (!currentUser?.uid) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${property.name}" permanently?\n\n` +
        "This property record will be completely removed."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(property.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteProperty(
        currentUser.uid,
        property.id
      );

      setProperties((current) =>
        current.filter(
          (item) => item.id !== property.id
        )
      );

      setSuccessMessage(
        `"${property.name}" has been deleted.`
      );
    } catch (err) {
      console.error("Delete property error:", err);

      setError(
        "Unable to delete this property. Please try again."
      );
    } finally {
      setDeletingId("");
    }
  };


  return (
    <div className="properties-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="properties-header">

        <div>
          <p className="properties-eyebrow">
            Property management
          </p>

          <h1>Properties</h1>

          <p className="properties-description">
            Add and manage properties so transactions can be
            assigned to Property 238, Property 240 or any other
            property you add in the future.
          </p>
        </div>


        <button
          type="button"
          className="properties-add-button"
          onClick={handleOpenAddModal}
        >
          <Plus
            size={19}
            strokeWidth={2.4}
          />

          <span>
            Add property
          </span>
        </button>

      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && !isModalOpen && (
        <div className="properties-message error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="properties-message success">

          <Check
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

      <section className="properties-summary">

        <div className="properties-summary-item">
          <span>
            Total properties
          </span>

          <strong>
            {properties.length}
          </strong>
        </div>


        <div className="properties-summary-item">
          <span>
            Active
          </span>

          <strong className="active-total">
            {
              properties.filter(
                (property) =>
                  property.isActive !== false
              ).length
            }
          </strong>
        </div>


        <div className="properties-summary-item">
          <span>
            Inactive
          </span>

          <strong className="inactive-total">
            {
              properties.filter(
                (property) =>
                  property.isActive === false
              ).length
            }
          </strong>
        </div>


        <div className="properties-summary-item">
          <span>
            With property number
          </span>

          <strong className="numbered-total">
            {
              properties.filter(
                (property) =>
                  Boolean(
                    property.propertyNumber?.trim()
                  )
              ).length
            }
          </strong>
        </div>

      </section>


      {/* =====================================================
          SEARCH
          ===================================================== */}

      <section className="properties-toolbar">

        <div className="properties-search">

          <Search
            size={18}
            strokeWidth={2}
          />

          <input
            type="search"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

      </section>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      {loading ? (

        <section className="properties-loading">

          <Loader2
            size={30}
            strokeWidth={2}
            className="properties-spinner"
          />

          <p>
            Loading properties...
          </p>

        </section>

      ) : filteredProperties.length === 0 ? (

        <section className="properties-empty-state">

          <div className="properties-empty-icon">

            <Building2
              size={30}
              strokeWidth={1.8}
            />

          </div>

          <h2>
            {searchTerm
              ? "No matching properties"
              : "No properties yet"}
          </h2>

          <p>
            {searchTerm
              ? "Try a different search term."
              : "Add your first property so transactions can be assigned and grouped by property."}
          </p>


          {!searchTerm && (
            <button
              type="button"
              className="properties-empty-button"
              onClick={handleOpenAddModal}
            >
              <Plus
                size={18}
                strokeWidth={2.4}
              />

              Add first property
            </button>
          )}

        </section>

      ) : (

        <section className="properties-grid">

          {filteredProperties.map((property) => {
            const isDeleting =
              deletingId === property.id;

            return (
              <article
                key={property.id}
                className={`property-card ${
                  property.isActive === false
                    ? "inactive"
                    : ""
                }`}
              >

                {/* CARD TOP */}

                <div className="property-card-top">

                  <div className="property-card-identity">

                    <div className="property-card-icon">

                      <Building2
                        size={23}
                        strokeWidth={2.1}
                      />

                    </div>


                    <div className="property-card-title">

                      <div className="property-card-title-row">

                        <h2>
                          {property.name}
                        </h2>


                        {property.isActive === false && (
                          <span className="property-inactive-badge">
                            Inactive
                          </span>
                        )}

                      </div>


                      {property.propertyNumber && (
                        <span className="property-number-badge">

                          <Hash
                            size={12}
                            strokeWidth={2.3}
                          />

                          {property.propertyNumber}

                        </span>
                      )}

                    </div>

                  </div>


                  <div className="property-card-actions">

                    <button
                      type="button"
                      className="property-card-action edit"
                      onClick={() =>
                        handleOpenEditModal(
                          property
                        )
                      }
                      aria-label={`Edit ${property.name}`}
                    >
                      <Edit3
                        size={16}
                        strokeWidth={2}
                      />
                    </button>


                    <button
                      type="button"
                      className="property-card-action delete"
                      onClick={() =>
                        handleDelete(property)
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${property.name}`}
                    >
                      {isDeleting ? (
                        <Loader2
                          size={16}
                          className="properties-spinner"
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


                {/* ADDRESS */}

                <div className="property-card-details">

                  {property.address ? (
                    <div className="property-detail-row">

                      <MapPin
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        {property.address}
                      </span>

                    </div>
                  ) : (
                    <p className="property-no-details">
                      No address added.
                    </p>
                  )}

                </div>


                {/* DESCRIPTION */}

                <div className="property-card-description">

                  <p>
                    {property.description ||
                      "No description added."}
                  </p>

                </div>


                {/* FOOTER */}

                <div className="property-card-footer">

                  <div className="property-balance-placeholder">

                    <span>
                      Net position
                    </span>

                    <strong>
                      £0.00
                    </strong>

                  </div>


                  <button
                    type="button"
                    className="property-view-button"
                    disabled
                    title="Available once transactions are connected"
                  >
                    View transactions
                  </button>

                </div>

              </article>
            );
          })}

        </section>

      )}


      {/* =====================================================
          ADD / EDIT MODAL
          ===================================================== */}

      {isModalOpen && (

        <div
          className="property-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseModal();
            }
          }}
        >

          <div
            className="property-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
          >

            {/* MODAL HEADER */}

            <div className="property-modal-header">

              <div>
                <p>
                  {editingProperty
                    ? "Update property"
                    : "New property"}
                </p>

                <h2 id="property-modal-title">
                  {editingProperty
                    ? "Edit property"
                    : "Add property"}
                </h2>
              </div>


              <button
                type="button"
                className="property-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORM */}

            <form
              className="property-modal-form"
              onSubmit={handleSubmit}
            >

              {error && (
                <div className="property-modal-error">
                  {error}
                </div>
              )}


              {/* PROPERTY NAME */}

              <div className="property-form-field">

                <label htmlFor="property-name">
                  Property name
                  <span>*</span>
                </label>

                <input
                  id="property-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Property 238"
                  value={formData.name}
                  onChange={handleChange}
                  autoFocus
                  required
                />

              </div>


              {/* PROPERTY NUMBER */}

              <div className="property-form-field">

                <label htmlFor="property-number">
                  Property number
                  <small>
                    Optional
                  </small>
                </label>

                <input
                  id="property-number"
                  name="propertyNumber"
                  type="text"
                  placeholder="e.g. 238"
                  value={formData.propertyNumber}
                  onChange={handleChange}
                />

              </div>


              {/* ADDRESS */}

              <div className="property-form-field">

                <label htmlFor="property-address">
                  Address
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="property-address"
                  name="address"
                  rows="2"
                  placeholder="Add an optional property address..."
                  value={formData.address}
                  onChange={handleChange}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="property-form-field">

                <label htmlFor="property-description">
                  Description
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="property-description"
                  name="description"
                  rows="3"
                  placeholder="Add an optional description..."
                  value={formData.description}
                  onChange={handleChange}
                />

              </div>


              {/* NOTES */}

              <div className="property-form-field">

                <label htmlFor="property-notes">
                  Private notes
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="property-notes"
                  name="notes"
                  rows="3"
                  placeholder="Add any private notes..."
                  value={formData.notes}
                  onChange={handleChange}
                />

              </div>


              {/* ACTIVE STATUS */}

              <label className="property-active-toggle">

                <div>
                  <strong>
                    Active property
                  </strong>

                  <span>
                    Active properties can be selected when
                    adding transactions.
                  </span>
                </div>


                <span className="property-toggle-control">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />

                  <span className="property-toggle-slider" />

                </span>

              </label>


              {/* ACTIONS */}

              <div className="property-modal-actions">

                <button
                  type="button"
                  className="property-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="property-modal-save"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="properties-spinner"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                        strokeWidth={2.4}
                      />

                      {editingProperty
                        ? "Save changes"
                        : "Create property"}
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

export default Properties;