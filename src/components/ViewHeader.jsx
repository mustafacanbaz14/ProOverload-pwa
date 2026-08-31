import React, { memo } from 'react';

/**
 * Ana sekmelerin başlık hiyerarşisini aynı tutar. `action` alanı tarih,
 * ayar veya bağlamsal bir eylem olabilir; içerik mobilde kendi genişliğini
 * korurken başlık daralabilir.
 */
const ViewHeader = memo(({ eyebrow, title, subtitle, action = null }) => (
  <header className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && <span className="luxury-eyebrow text-[10px] uppercase">{eyebrow}</span>}
      <h2 className="luxury-title text-xl font-black mt-0.5 leading-tight">{title}</h2>
      {subtitle && <p className="luxury-subtitle text-[10px] mt-1 leading-relaxed">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>
));

ViewHeader.displayName = 'ViewHeader';
export default ViewHeader;
