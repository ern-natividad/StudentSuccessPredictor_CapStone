import { useCallback, useEffect, useState } from "react";
import ConfirmModal from "../../../components/Common/ConfirmModal";
import { useToast } from "../../../components/Common/Toast";
import { api, isBackendAuthEnabled } from "../../../services/api";
import dashboardStyles from "../../../styles/Dashboard.module.css";
import styles from "../../../styles/Announcements.module.css";

const EMPTY_FORM = {
  title: "",
  content: "",
  imageUrl: "",
  actionLink: "",
  isActive: true,
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AnnouncementsPage = () => {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    if (!isBackendAuthEnabled()) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await api.getAnnouncements();
      setAnnouncements(result.announcements || []);
    } catch (error) {
      toast.error(error.message || "Unable to load announcements.");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      content: item.content || "",
      imageUrl: item.image_url || "",
      actionLink: item.action_link || "",
      isActive: Boolean(item.is_active),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.content.trim()) next.content = "Content is required.";
    if (form.actionLink.trim()) {
      const link = form.actionLink.trim();
      if (/^https?:\/\//i.test(link)) {
        try {
          // Validate absolute URLs only; relative paths like /pre-enrollment are allowed.
          const parsed = new URL(link);
          if (!parsed.protocol.startsWith("http")) {
            next.actionLink = "Enter a valid URL (https://...) or leave blank.";
          }
        } catch {
          next.actionLink = "Enter a valid URL (https://...) or leave blank.";
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readImageFile(file);
      setForm((prev) => ({ ...prev, imageUrl: String(dataUrl) }));
    } catch (error) {
      toast.error(error.message || "Unable to upload image.");
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      imageUrl: form.imageUrl.trim() || null,
      actionLink: form.actionLink.trim() || null,
      isActive: Boolean(form.isActive),
    };

    try {
      setSaving(true);
      if (editing?.id) {
        await api.updateAnnouncement(editing.id, payload);
        toast.success("Announcement updated.");
      } else {
        await api.createAnnouncement(payload);
        toast.success("Announcement published.");
      }
      closeModal();
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.updateAnnouncement(item.id, { isActive: !item.is_active });
      toast.success(item.is_active ? "Unpublished." : "Published.");
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || "Unable to update status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setSaving(true);
      await api.deleteAnnouncement(deleteTarget.id);
      toast.success("Announcement deleted.");
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || "Unable to delete announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={dashboardStyles.pageShell}>
      <div className={dashboardStyles.pageHeaderCard}>
        <div>
          <h1 className={dashboardStyles.pageTitle}>News & Announcements</h1>
          <p className={dashboardStyles.pageSubtitle}>
            Create homepage ads and campus announcements. Active posts appear as
            a popup for visitors on the Home page.
          </p>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={styles.primaryBtn} onClick={openCreate}>
            <i className="fas fa-plus" aria-hidden="true" />
            New announcement
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingBanner}>Loading announcements…</div>
      ) : announcements.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No announcements yet. Create one to show on the Home page.</p>
          <button type="button" className={styles.primaryBtn} onClick={openCreate}>
            Create announcement
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {announcements.map((item) => (
            <article key={item.id} className={styles.announcementCard}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt=""
                  className={styles.cardImage}
                />
              ) : null}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span
                    className={`${styles.badge} ${
                      item.is_active ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {item.is_active ? "Published" : "Draft"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    {formatDate(item.updated_at || item.created_at)}
                  </span>
                </div>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                <p className={styles.cardContent}>{item.content}</p>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={`${dashboardStyles.tableActionButton} ${styles.actionSlotLeft}`}
                    onClick={() => openEdit(item)}
                    title="Edit announcement"
                    aria-label={`Edit ${item.title}`}
                  >
                    <i className="fas fa-pen-to-square" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${dashboardStyles.tableActionButton} ${styles.actionSlotCenter}`}
                    onClick={() => setDeleteTarget(item)}
                    title="Delete announcement"
                    aria-label={`Delete ${item.title}`}
                    style={{ color: "#ef4444" }}
                  >
                    <i className="fas fa-trash-can" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.publishBtn} ${styles.actionSlotRight}`}
                    onClick={() => handleToggleActive(item)}
                    title={item.is_active ? "Unpublish" : "Publish"}
                  >
                    <i
                      className={`fas ${item.is_active ? "fa-eye-slash" : "fa-eye"}`}
                      aria-hidden="true"
                    />
                    {item.is_active ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className={styles.overlay} onClick={closeModal}>
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
          >
            <h2 id="announcement-modal-title" className={styles.modalTitle}>
              {editing ? "Edit announcement" : "New announcement"}
            </h2>
            <p className={styles.modalSubtitle}>
              Published posts appear on the public Home page popup.
            </p>

            <form onSubmit={handleSave}>
              <div className={styles.field}>
                <label htmlFor="announcement-title">Title</label>
                <input
                  id="announcement-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Midterm advising week"
                  maxLength={160}
                />
                {errors.title ? (
                  <span className={styles.fieldError}>{errors.title}</span>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="announcement-content">Content</label>
                <textarea
                  id="announcement-content"
                  value={form.content}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, content: event.target.value }))
                  }
                  placeholder="Write the announcement body…"
                  maxLength={4000}
                />
                {errors.content ? (
                  <span className={styles.fieldError}>{errors.content}</span>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="announcement-link">Action link (optional)</label>
                <input
                  id="announcement-link"
                  value={form.actionLink}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      actionLink: event.target.value,
                    }))
                  }
                  placeholder="https://… or /pre-enrollment"
                />
                {errors.actionLink ? (
                  <span className={styles.fieldError}>{errors.actionLink}</span>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="announcement-image">Promo image (optional)</label>
                <input
                  id="announcement-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <input
                  value={
                    form.imageUrl.startsWith("data:")
                      ? ""
                      : form.imageUrl
                  }
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      imageUrl: event.target.value,
                    }))
                  }
                  placeholder="Or paste an image URL"
                  style={{ marginTop: "0.45rem" }}
                />
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                ) : null}
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <strong>Publish now</strong>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Inactive posts stay hidden from the Home page.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  aria-label="Publish announcement"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete announcement?"
        description="This permanently removes the post from the Home page and admin list."
        confirmText={saving ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        onCancel={() => (saving ? null : setDeleteTarget(null))}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AnnouncementsPage;
