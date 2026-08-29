import React, { memo, useEffect, useRef, useState } from 'react';

/**
 * Ekranın altındaki pahalı bölümleri kullanıcı yaklaşana kadar çizmez.
 * IntersectionObserver olmayan eski tarayıcıda içerik doğrudan gösterilir;
 * bu bir özellik kapısı değil, yalnızca aşamalı bir performans iyileştirmesidir.
 */
const DeferredSection = memo(({
  children,
  fallback = null,
  rootMargin = '320px 0px',
  minHeight = 120,
  className = '',
}) => {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(() => (
    typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined'
  ));

  useEffect(() => {
    if (visible || !hostRef.current) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin });

    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={!visible ? { minHeight } : undefined}
      aria-busy={!visible || undefined}
    >
      {visible ? children : fallback}
    </div>
  );
});

DeferredSection.displayName = 'DeferredSection';
export default DeferredSection;
