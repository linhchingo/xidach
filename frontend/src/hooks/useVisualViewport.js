import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook that tracks the visual viewport dimensions and provides
 * scroll-locking helpers for Safari mobile keyboard behaviour.
 *
 * On mobile Safari the body gets scrolled when the keyboard opens/closes.
 * lockScroll() freezes the body in place (position: fixed) so Safari
 * cannot shift it, and unlockScroll() restores it afterwards.
 */
const useVisualViewport = () => {
  const getViewport = useCallback(() => {
    const vv = window.visualViewport;
    if (vv) {
      return { height: vv.height, offsetTop: vv.offsetTop };
    }
    return { height: window.innerHeight, offsetTop: 0 };
  }, []);

  const [viewport, setViewport] = useState(getViewport);
  const savedScrollY = useRef(0);
  const isLocked = useRef(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleUpdate = () => {
      setViewport({ height: vv.height, offsetTop: vv.offsetTop });

      // While scroll is locked, Safari can still try to shift the
      // visual-viewport offset.  Reset window.scrollTo(0, …) to
      // keep the page pinned.
      if (isLocked.current) {
        window.scrollTo(0, 0);
      }
    };

    vv.addEventListener('resize', handleUpdate);
    vv.addEventListener('scroll', handleUpdate);

    return () => {
      vv.removeEventListener('resize', handleUpdate);
      vv.removeEventListener('scroll', handleUpdate);
    };
  }, []);

  /**
   * Freeze the page so Safari's keyboard cannot displace it.
   * Works by setting body to position:fixed with a negative top
   * matching the current scroll offset.
   */
  const lockScroll = useCallback(() => {
    if (isLocked.current) return;
    isLocked.current = true;
    savedScrollY.current = window.scrollY;

    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY.current}px`;
    body.style.width = '100%';
  }, []);

  /**
   * Release the page and restore the previous scroll position.
   * NOTE: overflow is intentionally NOT managed here — MUI Dialog
   * handles its own overflow:hidden on the body.
   */
  const unlockScroll = useCallback(() => {
    if (!isLocked.current) return;
    isLocked.current = false;

    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';

    // Restore the scroll position that was saved before locking
    window.scrollTo(0, savedScrollY.current);
  }, []);

  return { ...viewport, lockScroll, unlockScroll };
};

export default useVisualViewport;
