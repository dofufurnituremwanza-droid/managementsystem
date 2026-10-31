import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="toast-container no-print">
      <div className={`toast toast-${toast.type}`}>
        {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
        {toast.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
        {toast.type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
