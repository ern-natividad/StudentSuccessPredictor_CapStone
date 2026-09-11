import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import styles from "../../styles/Announcements.module.css";

const DISMISS_STORAGE_KEY = "hawkpredict-news-dismiss";

const todayKey = () => new Date().toISOString().slice(0, 10);

const readDismissState = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const wasDismissedToday = (announcementId) => {
  const saved = readDismissState();
  if (!saved?.id || !saved?.date) return false;
  return saved.id === announcementId && saved.date === todayKey();
};

const saveDismissToday = (announcementId) => {
  localStorage.setItem(
    DISMISS_STORAGE_KEY,
    JSON.stringify({ id: announcementId, date: todayKey() }),
  );
};

/**
 * Fetches the latest active announcement and shows a Home-page popup
 * unless the visitor chose "Don't show again today" for that post.
 */
const HomeAnnouncementModal = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await api.getActiveAnnouncements(1);
        const latest = result?.announcements?.[0] || null;
        if (cancelled || !latest?.id) return;

        if (wasDismissedToday(latest.id)) return;

        setAnnouncement(latest);
        setOpen(true);
      } catch {
        // Home stays usable if announcements API is offline.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const actionHref = useMemo(() => {
    const link = String(announcement?.action_link || "").trim();
    return link || null;
  }, [announcement]);

  const handleClose = () => {
    if (announcement?.id && dontShowToday) {
      saveDismissToday(announcement.id);
    }
    setOpen(false);
  };

  if (!open || !announcement) return null;

  return (
    <div
      className={styles.homeOverlay}
      role="presentation"
      onClick={handleClose}
    >
      <div
        className={styles.homeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-news-title"
        onClick={(event) => event.stopPropagation()}
      >
        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt=""
            className={styles.homeImage}
          />
        ) : (
          <div
            className={styles.homeImage}
            style={{ height: 88 }}
            aria-hidden="true"
          />
        )}

        <div className={styles.homeBody}>
          <div className={styles.homeEyebrow}>
            <i className="fas fa-bullhorn" aria-hidden="true" />
            News & Announcements
          </div>
          <h2 id="home-news-title" className={styles.homeTitle}>
            {announcement.title}
          </h2>
          <p className={styles.homeContent}>{announcement.content}</p>

          <div className={styles.homeActions}>
            <label className={styles.homeDismissCheck}>
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(event) => setDontShowToday(event.target.checked)}
              />
              Don&apos;t show again today
            </label>

            {actionHref ? (
              <a
                className={styles.primaryBtn}
                href={actionHref}
                target={actionHref.startsWith("http") ? "_blank" : undefined}
                rel={
                  actionHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                onClick={handleClose}
              >
                Learn more
              </a>
            ) : null}

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAnnouncementModal;
