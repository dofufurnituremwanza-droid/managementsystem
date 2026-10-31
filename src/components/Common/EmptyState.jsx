import React from 'react';
import { Plus } from 'lucide-react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon-wrap">
          {Icon && <Icon size={34} />}
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        {actionLabel && onAction && (
          <button className="btn btn-primary" onClick={onAction}>
            <Plus size={16} />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
