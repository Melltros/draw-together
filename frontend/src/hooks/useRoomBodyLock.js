import { useEffect } from 'react';

/** Stops pull-to-refresh & page bounce while in the drawing room */
export function useRoomBodyLock(active) {
  useEffect(() => {
    if (!active) return;

    const html = document.documentElement;
    const body = document.body;

    html.classList.add('room-mode');
    body.classList.add('room-mode');

    const blockGesture = (e) => {
      if (e.target?.closest?.('.color-strip-scroll, .sticker-scroll, .touch-scrollable, .mobile-bottomsheet-scroll')) {
        return;
      }
      if (e.touches.length > 1) e.preventDefault();
    };

    document.addEventListener('touchmove', blockGesture, { passive: false });

    return () => {
      html.classList.remove('room-mode');
      body.classList.remove('room-mode');
      document.removeEventListener('touchmove', blockGesture);
    };
  }, [active]);
}

export default useRoomBodyLock;
