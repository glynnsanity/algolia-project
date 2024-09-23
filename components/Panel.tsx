import React from 'react';

export function Panel({
  children,
  header,
  footer,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const newHeader = (header !== undefined && typeof header === 'string') ?  header.replace('_', ' ') : header 
  return (
    <div className="ais-Panel">
      {newHeader && <div className="ais-Panel-header">{newHeader}</div>}
      <div className="ais-Panel-body">{children}</div>
      {footer && <div className="ais-Panel-footer">{footer}</div>}
    </div>
  );
}
