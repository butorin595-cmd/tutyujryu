import React, { useEffect } from 'react';
export default function Notification({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`notification ${type}`} role="alert">
      <span>{message}</span>
      <button onClick={onClose} aria-label="Закрыть уведомление">×</button>
    </div>
  );
}