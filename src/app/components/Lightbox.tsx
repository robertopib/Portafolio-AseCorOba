import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Wrapper for full-screen image lightboxes.
 *
 * Fixes two long-standing issues with the inline modals:
 *  - Renders via a portal to <body> so the overlay escapes any ancestor
 *    stacking context (e.g. the `relative z-10` page container) and reliably
 *    covers everything, including the fixed Navigation bar.
 *  - Locks background scroll while the lightbox is open, restoring the
 *    previous value on close.
 *
 * Only mount this while the lightbox should be visible (render it
 * conditionally); the scroll lock is tied to mount/unmount.
 */
export function Lightbox({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(children, document.body);
}
