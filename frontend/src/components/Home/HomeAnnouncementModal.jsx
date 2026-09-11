import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import styles from "../../styles/Announcements.module.css";

const DISMISS_STORAGE_KEY = "hawkpredict-news-dismiss";
const AUTO_ROTATE_MS = 6500;

const todayKey = () => new Date().toISOString().slice(0, 10);

const readDismissState = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const getDismissedIdsToday = () => {
  const saved = readDismissState();
  if (!saved || saved.date !== todayKey()) return new Set();

  // Support older single-id format: { id, date }
  if (saved.id) return new Set([saved.id]);
  if (Array.isArray(saved.ids)) return new Set(saved.ids);
  return new Set();
};

const saveDismissToday = (announcementIds) => {
  const existing = getDismissedIdsToday();
  announcementIds.forEach((id) => existing.add(id));
  localStorage.setItem(
    DISMISS_STORAGE_KEY,
    JSON.stringify({ date: todayKey(), ids: [...existing] }),
  );
};

/**
 * Shows all active Home-page ads in one popup carousel.
 * Visitors can rotate through each announcement; "Don't show again today"
 * dismisses the currently loaded set for the rest of the day.
 */
const HomeAnnouncementModal = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await api.getActiveAnnouncements(20);
        const dismissed = getDismissedIdsToday();
        const active = (result?.announcements || []).filter(
          (item) => item?.id && !dismissed.has(item.id),
        );
        if (cancelled || active.length === 0) return;

        setAnnouncements(active);
        setIndex(0);
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

  const announcement = announcements[index] || null;
  const total = announcements.length;

  useEffect(() => {
    if (!open || total <= 1 || leaving) return undefined;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
      setSlideKey((prev) => prev + 1);
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [open, total, leaving, index]);

  const actionHref = useMemo(() => {
    const link = String(announcement?.action_link || "").trim();
    return link || null;
  }, [announcement]);

  const goTo = (nextIndex) => {
    if (total <= 1) return;
    setIndex(((nextIndex % total) + total) % total);
    setSlideKey((prev) => prev + 1);
  };

  const handleClose = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      if (dontShowToday && announcements.length > 0) {
        saveDismissToday(announcements.map((item) => item.id));
      }
      setOpen(false);
      setLeaving(false);
    }, 320);
  };

  if (!open || !announcement) return null;

  const tickerText = `${announcement.title}  •  ${String(announcement.content || "")
    .replace(/\s+/g, " ")
    .trim()}`;

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
          <span className={styles.homeAdBadge}>
            Announcement{total > 1 ? ` ${index + 1} / ${total}` : ""}
          </span>
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
          <div className={styles.homeTickerTrack} key={`ticker-${announcement.id}`}>
            <span>{tickerText}</span>
            <span>{tickerText}</span>
          </div>
        </div>

        <div className={styles.homeAdMedia} key={`media-${slideKey}`}>
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

          {total > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.homeNavBtn} ${styles.homeNavPrev}`}
                onClick={() => goTo(index - 1)}
                aria-label="Previous announcement"
                title="Previous"
              >
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.homeNavBtn} ${styles.homeNavNext}`}
                onClick={() => goTo(index + 1)}
                aria-label="Next announcement"
                title="Next"
              >
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        <div className={styles.homeBody} key={`body-${slideKey}`}>
          <div className={styles.homeEyebrow}>
            <i className="fas fa-sparkles" aria-hidden="true" />
            Featured announcement
          </div>
          <h2 id="home-news-title" className={styles.homeTitle}>
            {announcement.title}
          </h2>
          <p className={styles.homeContent}>{announcement.content}</p>

          {total > 1 ? (
            <div className={styles.homeDots} role="tablist" aria-label="Announcements">
              {announcements.map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={dotIndex === index}
                  className={`${styles.homeDot} ${
                    dotIndex === index ? styles.homeDotActive : ""
                  }`}
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Show announcement ${dotIndex + 1}`}
                />
              ))}
            </div>
          ) : null}

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
