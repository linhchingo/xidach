import { useEffect, useState, useCallback } from 'react';

/**
 * Hook that tracks the visual viewport dimensions.
 * On mobile, the visual viewport shrinks when the keyboard opens,
 * so by binding the Dialog to these values, it always stays
 * within the visible area — no keyboard-detection heuristics needed.
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

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleUpdate = () => {
      setViewport({ height: vv.height, offsetTop: vv.offsetTop });
    };

    vv.addEventListener('resize', handleUpdate);
    vv.addEventListener('scroll', handleUpdate);

    return () => {
      vv.removeEventListener('resize', handleUpdate);
      vv.removeEventListener('scroll', handleUpdate);
    };
  }, []);

  return viewport;
};

export default useVisualViewport;
