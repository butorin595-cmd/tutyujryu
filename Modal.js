import React, { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose }) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    previousActiveElementRef.current = document.activeElement;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    const modal = modalRef.current;
    if (modal) {
      const focusable = modal.querySelectorAll(focusableSelectors.join(','));
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        modal.focus();
      }
    }
    return () => {
      const prev = previousActiveElementRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input[type="text"]:not([disabled])',
        'input[type="radio"]:not([disabled])',
        'input[type="checkbox"]:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = Array.from(modal.querySelectorAll(focusableSelectors.join(',')));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!modal.contains(document.activeElement)) {
        first.focus();
        e.preventDefault();
      } else {
        if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      }
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 title={title}>{title}</h2>
          <button onClick={onClose} aria-label="Закрыть модальное окно">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
