'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type RouteProgressBarProps = {
  routeKey: string;
  enabled?: boolean;
};

export function RouteProgressBar({ routeKey, enabled = true }: RouteProgressBarProps) {
  const previousRoute = useRef(routeKey);
  const navigationPending = useRef(false);
  const intervalTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const completeProgress = useCallback(() => {
    navigationPending.current = false;
    if (intervalTimer.current !== null) window.clearInterval(intervalTimer.current);
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);

    intervalTimer.current = null;
    fallbackTimer.current = null;
    setVisible(true);
    setProgress(100);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      hideTimer.current = null;
    }, 180);
  }, []);

  const startProgress = useCallback(() => {
    if (navigationPending.current) return;

    navigationPending.current = true;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    setVisible(true);
    setProgress(12);
    intervalTimer.current = window.setInterval(() => {
      setProgress((current) => Math.min(88, current + Math.max(2, (88 - current) * 0.12)));
    }, 120);
    fallbackTimer.current = window.setTimeout(completeProgress, 12000);
  }, [completeProgress]);

  useEffect(() => {
    if (previousRoute.current === routeKey) {
      return;
    }

    previousRoute.current = routeKey;
    if (navigationPending.current) {
      completeProgress();
    } else if (enabled) {
      startProgress();
      completeProgress();
    }
  }, [completeProgress, enabled, routeKey, startProgress]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      ) {
        return;
      }

      startProgress();
    };

    const handlePopState = () => startProgress();
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, startProgress]);

  useEffect(() => () => {
    if (intervalTimer.current !== null) window.clearInterval(intervalTimer.current);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
  }, []);

  return (
    <div
      className={`route-progress${visible ? ' route-progress--visible' : ''}`}
      role="progressbar"
      aria-label="Page navigation"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-hidden={!visible}
    >
      <span className="route-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

export default function RouteProgress() {
  const { pathname, search } = useLocation();
  return <RouteProgressBar routeKey={`${pathname}?${search}`} />;
}
