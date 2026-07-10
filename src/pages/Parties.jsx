import "../styles/parties.css";
import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  Check,
  Edit3,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  createParty,
  deleteParty,
  getParties,
  updateParty,
} from "../services/partyService";


const DEFAULT_FORM = {
  name: "",
  type: "person",
  phone: "",
  email: "",
  address: "",
  description: "",
  notes: "",
  isActive: true,
};


const PARTY_TYPES = [
  {
    value: "person",
    label: "Person",
  },
  {
    value: "company",
    label: "Company",
  },
  {
    value: "tenant",
    label: "Tenant",
  },
  {
    value: "supplier",
    label: "Supplier",
  },
  {
    value: "contractor",
    label: "Contractor",
  },
  {
    value: "employee",
    label: "Employee",
  },
  {
    value: "customer",
    label: "Customer",
  },
  {
    value: "other",
    label: "Other",
  },
];


function Parties() {
  const { currentUser } = useAuth();

  const [parties, setParties] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  const [formData, setFormData] = useState(DEFAULT_FORM);


  /* =========================================================
     LOAD PARTIES
     ========================================================= */

  const loadParties = async () => {
    if (!currentUser?.uid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const partyList = await getParties(currentUser.uid);

      setParties(partyList);
    } catch (err) {
      console.error("Load parties error:", err);

      setError(
        "Unable to load people and companies. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadParties();
  }, [currentUser?.uid]);


  /* =========================================================
     FILTERED PARTIES
     ========================================================= */

  const filteredParties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return parties.filter((party) => {
      const matchesSearch =
        !search ||
        party.name?.toLowerCase().includes(search) ||
        party.phone?.toLowerCase().includes(search) ||
        party.email?.toLowerCase().includes(search) ||
        party.address?.toLowerCase().includes(search) ||
        party.description?.toLowerCase().includes(search);

      const matchesType =
        typeFilter === "all" ||
        party.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [parties, searchTerm, typeFilter]);


  /* =========================================================
     OPEN ADD MODAL
     ========================================================= */

  const handleOpenAddModal = () => {
    setEditingParty(null);
    setFormData(DEFAULT_FORM);

    setError("");
    setSuccessMessage("");

    setIsModalOpen(true);
  };


  /* =========================================================
     OPEN EDIT MODAL
     ========================================================= */

  const handleOpenEditModal = (party) => {
    setEditingParty(party);

    setFormData({
      name: party.name || "",
      type: party.type || "person",
      phone: party.phone || "",
      email: party.email || "",
      address: party.address || "",
      description: party.description || "",
      notes: party.notes || "",
      isActive:
        typeof party.isActive === "boolean"
          ? party.isActive
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
    setEditingParty(null);
    setFormData(DEFAULT_FORM);
    setError("");
  };


  /* =========================================================
     HANDLE FORM CHANGE
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
     SAVE PARTY
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.uid) {
      return;
    }

    const cleanName = formData.name.trim();

    if (!cleanName) {
      setError(
        "Please enter a person or company name."
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const partyPayload = {
        name: cleanName,
        type: formData.type,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        description: formData.description,
        notes: formData.notes,
        isActive: formData.isActive,
      };

      if (editingParty) {
        await updateParty(
          currentUser.uid,
          editingParty.id,
          partyPayload
        );

        setSuccessMessage(
          `"${cleanName}" has been updated.`
        );
      } else {
        await createParty(
          currentUser.uid,
          partyPayload
        );

        setSuccessMessage(
          `"${cleanName}" has been added.`
        );
      }

      setIsModalOpen(false);
      setEditingParty(null);
      setFormData(DEFAULT_FORM);

      await loadParties();
    } catch (err) {
      console.error("Save party error:", err);

      setError(
        err.message ||
          "Unable to save this record. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     DELETE PARTY
     ========================================================= */

  const handleDelete = async (party) => {
    if (!currentUser?.uid) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${party.name}" permanently?\n\n` +
        "This person or company record will be completely removed."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(party.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteParty(
        currentUser.uid,
        party.id
      );

      setParties((current) =>
        current.filter(
          (item) => item.id !== party.id
        )
      );

      setSuccessMessage(
        `"${party.name}" has been deleted.`
      );
    } catch (err) {
      console.error("Delete party error:", err);

      setError(
        "Unable to delete this record. Please try again."
      );
    } finally {
      setDeletingId("");
    }
  };


  /* =========================================================
     TYPE DETAILS
     ========================================================= */

  const getPartyTypeLabel = (type) => {
    return (
      PARTY_TYPES.find(
        (item) => item.value === type
      )?.label || "Other"
    );
  };


  const getPartyIcon = (type) => {
    if (type === "company") {
      return Building2;
    }

    return UserRound;
  };


  return (
    <div className="parties-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="parties-header">

        <div>
          <p className="parties-eyebrow">
            Khaata contacts
          </p>

          <h1>People & Companies</h1>

          <p className="parties-description">
            Add individuals, companies, tenants, contractors,
            suppliers or anyone else you want to assign
            transactions to.
          </p>
        </div>


        <button
          type="button"
          className="parties-add-button"
          onClick={handleOpenAddModal}
        >
          <Plus
            size={19}
            strokeWidth={2.4}
          />

          <span>
            Add person or company
          </span>
        </button>

      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && !isModalOpen && (
        <div className="parties-message error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="parties-message success">

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

      <section className="parties-summary">

        <div className="parties-summary-item">
          <span>
            Total records
          </span>

          <strong>
            {parties.length}
          </strong>
        </div>


        <div className="parties-summary-item">
          <span>
            People
          </span>

          <strong className="people-total">
            {
              parties.filter(
                (party) =>
                  party.type === "person"
              ).length
            }
          </strong>
        </div>


        <div className="parties-summary-item">
          <span>
            Companies
          </span>

          <strong className="companies-total">
            {
              parties.filter(
                (party) =>
                  party.type === "company"
              ).length
            }
          </strong>
        </div>


        <div className="parties-summary-item">
          <span>
            Active
          </span>

          <strong className="active-total">
            {
              parties.filter(
                (party) =>
                  party.isActive !== false
              ).length
            }
          </strong>
        </div>

      </section>


      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <section className="parties-toolbar">

        <div className="parties-search">

          <Search
            size={18}
            strokeWidth={2}
          />

          <input
            type="search"
            placeholder="Search people or companies..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>


        <div className="parties-filter-wrapper">

          <Filter
            size={17}
            strokeWidth={2}
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            aria-label="Filter by type"
          >
            <option value="all">
              All types
            </option>

            {PARTY_TYPES.map((type) => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}

          </select>

        </div>

      </section>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      {loading ? (

        <section className="parties-loading">

          <Loader2
            size={30}
            strokeWidth={2}
            className="parties-spinner"
          />

          <p>
            Loading people and companies...
          </p>

        </section>

      ) : filteredParties.length === 0 ? (

        <section className="parties-empty-state">

          <div className="parties-empty-icon">
            <Users
              size={30}
              strokeWidth={1.8}
            />
          </div>

          <h2>
            {searchTerm || typeFilter !== "all"
              ? "No matching records"
              : "No people or companies yet"}
          </h2>

          <p>
            {searchTerm || typeFilter !== "all"
              ? "Try changing your search or filter."
              : "Add a person or company so transactions can be assigned and grouped into individual khaatas."}
          </p>


          {!searchTerm &&
            typeFilter === "all" && (
              <button
                type="button"
                className="parties-empty-button"
                onClick={handleOpenAddModal}
              >
                <Plus
                  size={18}
                  strokeWidth={2.4}
                />

                Add first record
              </button>
            )}

        </section>

      ) : (

        <section className="parties-grid">

          {filteredParties.map((party) => {
            const PartyIcon =
              getPartyIcon(party.type);

            const isDeleting =
              deletingId === party.id;

            return (
              <article
                key={party.id}
                className={`party-card ${
                  party.isActive === false
                    ? "inactive"
                    : ""
                }`}
              >

                <div className="party-card-top">

                  <div className="party-card-identity">

                    <div className="party-card-avatar">
                      <PartyIcon
                        size={22}
                        strokeWidth={2.1}
                      />
                    </div>

                    <div className="party-card-title">

                      <div className="party-card-title-row">

                        <h2>
                          {party.name}
                        </h2>

                        {party.isActive === false && (
                          <span className="party-inactive-badge">
                            Inactive
                          </span>
                        )}

                      </div>

                      <span className="party-type-badge">
                        {getPartyTypeLabel(
                          party.type
                        )}
                      </span>

                    </div>

                  </div>


                  <div className="party-card-actions">

                    <button
                      type="button"
                      className="party-card-action edit"
                      onClick={() =>
                        handleOpenEditModal(
                          party
                        )
                      }
                      aria-label={`Edit ${party.name}`}
                    >
                      <Edit3
                        size={16}
                        strokeWidth={2}
                      />
                    </button>


                    <button
                      type="button"
                      className="party-card-action delete"
                      onClick={() =>
                        handleDelete(party)
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${party.name}`}
                    >
                      {isDeleting ? (
                        <Loader2
                          size={16}
                          className="parties-spinner"
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


                <div className="party-card-details">

                  {party.phone && (
                    <div className="party-detail-row">

                      <Phone
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        {party.phone}
                      </span>

                    </div>
                  )}


                  {party.email && (
                    <div className="party-detail-row">

                      <Mail
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        {party.email}
                      </span>

                    </div>
                  )}


                  {party.address && (
                    <div className="party-detail-row">

                      <MapPin
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        {party.address}
                      </span>

                    </div>
                  )}


                  {!party.phone &&
                    !party.email &&
                    !party.address && (
                      <p className="party-no-contact-details">
                        No contact details added.
                      </p>
                    )}

                </div>


                <div className="party-card-description">

                  <p>
                    {party.description ||
                      "No description added."}
                  </p>

                </div>


                <div className="party-card-footer">

                  <div className="party-balance-placeholder">

                    <span>
                      Current balance
                    </span>

                    <strong>
                      £0.00
                    </strong>

                  </div>


                  <button
                    type="button"
                    className="party-view-khaata-button"
                    disabled
                    title="Available once transactions are connected"
                  >
                    View khaata
                  </button>

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
          className="party-modal-backdrop"
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
            className="party-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="party-modal-title"
          >

            <div className="party-modal-header">

              <div>
                <p>
                  {editingParty
                    ? "Update record"
                    : "New record"}
                </p>

                <h2 id="party-modal-title">
                  {editingParty
                    ? "Edit person or company"
                    : "Add person or company"}
                </h2>
              </div>


              <button
                type="button"
                className="party-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="party-modal-form"
              onSubmit={handleSubmit}
            >

              {error && (
                <div className="party-modal-error">
                  {error}
                </div>
              )}


              {/* NAME */}

              <div className="party-form-field">

                <label htmlFor="party-name">
                  Name
                  <span>*</span>
                </label>

                <input
                  id="party-name"
                  name="name"
                  type="text"
                  placeholder="e.g. John Smith or ABC Builders Ltd"
                  value={formData.name}
                  onChange={handleChange}
                  autoFocus
                  required
                />

              </div>


              {/* TYPE */}

              <div className="party-form-field">

                <label htmlFor="party-type">
                  Type
                </label>

                <select
                  id="party-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  {PARTY_TYPES.map(
                    (type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    )
                  )}
                </select>

              </div>


              <div className="party-form-grid">

                {/* PHONE */}

                <div className="party-form-field">

                  <label htmlFor="party-phone">
                    Phone
                    <small>
                      Optional
                    </small>
                  </label>

                  <input
                    id="party-phone"
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />

                </div>


                {/* EMAIL */}

                <div className="party-form-field">

                  <label htmlFor="party-email">
                    Email
                    <small>
                      Optional
                    </small>
                  </label>

                  <input
                    id="party-email"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />

                </div>

              </div>


              {/* ADDRESS */}

              <div className="party-form-field">

                <label htmlFor="party-address">
                  Address
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="party-address"
                  name="address"
                  rows="2"
                  placeholder="Add an optional address..."
                  value={formData.address}
                  onChange={handleChange}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="party-form-field">

                <label htmlFor="party-description">
                  Description
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="party-description"
                  name="description"
                  rows="3"
                  placeholder="e.g. Main building contractor for Property 238..."
                  value={formData.description}
                  onChange={handleChange}
                />

              </div>


              {/* NOTES */}

              <div className="party-form-field">

                <label htmlFor="party-notes">
                  Private notes
                  <small>
                    Optional
                  </small>
                </label>

                <textarea
                  id="party-notes"
                  name="notes"
                  rows="3"
                  placeholder="Add any private notes..."
                  value={formData.notes}
                  onChange={handleChange}
                />

              </div>


              {/* ACTIVE */}

              <label className="party-active-toggle">

                <div>
                  <strong>
                    Active record
                  </strong>

                  <span>
                    Active people and companies can
                    be selected when adding transactions.
                  </span>
                </div>


                <span className="party-toggle-control">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />

                  <span className="party-toggle-slider" />

                </span>

              </label>


              {/* ACTIONS */}

              <div className="party-modal-actions">

                <button
                  type="button"
                  className="party-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="party-modal-save"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="parties-spinner"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                        strokeWidth={2.4}
                      />

                      {editingParty
                        ? "Save changes"
                        : "Create record"}
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

export default Parties;