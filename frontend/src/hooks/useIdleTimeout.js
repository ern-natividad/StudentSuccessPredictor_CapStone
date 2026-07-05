import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

/**
 * Calls onIdle after `timeoutMs` with no mouse movement, mouse clicks,
 * keyboard input, or scrolling. The timer resets on every tracked event.
 */
export const useIdleTimeout = (onIdle, timeoutMs = 15 * 60 * 1000, enabled = true) => {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [resetTimer, enabled]);
};
