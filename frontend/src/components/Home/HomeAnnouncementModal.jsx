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
 * Fetches the latest active announcement and shows a Home-page ad popup
 * unless the visitor chose "Don't show again today" for that post.
 */
const HomeAnnouncementModal = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(true);
  const [leaving, setLeaving] = useState(false);

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
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      if (announcement?.id && dontShowToday) {
        saveDismissToday(announcement.id);
      }
      setOpen(false);
      setLeaving(false);
    }, 320);
  };

  if (!open || !announcement) return null;

  const tickerText = `${announcement.title}  •  ${announcement.content.replace(/\s+/g, " ").trim()}`;

  return (
    <div
      className={`${styles.homeOverlay} ${leaving ? styles.homeOverlayLeaving : ""}`}
      role="presentation"
      onClick={handleClose}
    >
      <div
        className={`${styles.homeAd} ${leaving ? styles.homeAdLeaving : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-news-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.homeAdRibbon}>
          <span className={styles.homeAdBadge}>Announcement</span>
          <button
            type="button"
            className={styles.homeAdClose}
            onClick={handleClose}
            aria-label="Close advertisement"
            title="Close"
          >
            <i className="fas fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.homeTicker} aria-hidden="true">
          <div className={styles.homeTickerTrack}>
            <span>{tickerText}</span>
            <span>{tickerText}</span>
          </div>
        </div>

        <div className={styles.homeAdMedia}>
          {announcement.image_url ? (
            <img
              src={announcement.image_url}
              alt=""
              className={styles.homeImage}
            />
          ) : (
            <div className={styles.homeImageFallback}>
              <i className="fas fa-bullhorn" aria-hidden="true" />
              <span>Campus News</span>
            </div>
          )}
          <div className={styles.homeAdShine} aria-hidden="true" />
        </div>

        <div className={styles.homeBody}>
          <div className={styles.homeEyebrow}>
            <i className="fas fa-sparkles" aria-hidden="true" />
            Featured announcement
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
                className={styles.adCta}
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
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                className={styles.adCta}
                onClick={handleClose}
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAnnouncementModal;
