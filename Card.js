import React, { useState } from 'react';

export default function Card({ title, image, onOpen, onDelete, downloadLink, actionText = 'Открыть' }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDownload = () => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowConfirm(false);
  };

  return (
    <article className="card" title={title}>
      {image ? (
        <img className="card-image" src={image} alt={title} loading="lazy" />
      ) : (
        <div className="file-icon">📄</div>
      )}

      <h3>{title}</h3>

      <div className="card-actions">
        {onOpen && <button onClick={onOpen} title={actionText}>{actionText}</button>}
        {downloadLink && !showConfirm && <button onClick={() => setShowConfirm(true)}>Скачать</button>}
        {onDelete && <button className="danger" onClick={onDelete} title="Удалить">Удалить</button>}
      </div>

      {showConfirm && (
        <div className="download-confirm">
          <span>Скачать {title}?</span>
          <button onClick={handleDownload}>Скачать</button>
          <button onClick={() => setShowConfirm(false)}>Отмена</button>
        </div>
      )}
    </article>
  );
}
