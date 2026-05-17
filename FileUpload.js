import React, { useRef } from 'react';

export default function FileUpload({ accept, onFile, label }) {
  const inputRef = useRef(null);

  return (
    <>
      <button className="btn" onClick={() => inputRef.current?.click()} aria-label={label}>{label}</button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </>
  );
}
