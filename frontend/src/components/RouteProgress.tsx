'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteProgress() {
  const { pathname, search } = useLocation();
  const isInitialRoute = useRef(true);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isInitialRoute.current) {
      isInitialRoute.current = false;
      return;
    }

    setVisible(true);
    setProgress(18);

    const advanceTimer = window.setTimeout(() => setProgress(72), 90);
    const completeTimer = window.setTimeout(() => setProgress(100), 220);
    const hideTimer = window.setTimeout(() => setVisible(false), 430);

    return () => {
      window.clearTimeout(advanceTimer);
      window.clearTimeout(completeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname, search]);

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
