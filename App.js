import React, { useEffect, useMemo, useState } from 'react';
import Lightbox from 'react-image-lightbox';
import * as XLSX from 'xlsx';
import 'react-image-lightbox/style.css';
import './index.css';
import { getAllFiles, uploadFile, deleteFile, selectBackground } from './api';
import Tabs from './Tabs';
import Card from './components/Card';
import FileUpload from './components/FileUpload';
import Modal from './components/Modal';
import ProjectDetails from './components/ProjectDetails';
import Notification from './components/Notification';
const tabs = [
  { key: 'documents', title: 'Документы' },
  { key: 'photos', title: 'Фото' },
  { key: 'tables', title: 'Таблицы' }
];

const acceptMap = {
  documents: '.pdf,.doc,.docx,.xlsx,.xls',
  photos: 'image/*',
  tables: '.xlsx,.xls,.csv'
};

function App() {
  const [activeTab, setActiveTab] = useState('documents');
  const [files, setFiles] = useState({ documents: [], photos: [], tables: [], backgrounds: [] });
  const [background, setBackground] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const documentsList = files.documents || [];
  const pdfFiles = useMemo(() => {
    return documentsList.filter(file => {
      const name = file.name.toLowerCase();
      return name.includes(search.toLowerCase()) && /\.pdf$/i.test(name);
    });
  }, [documentsList, search]);
  const wordFiles = useMemo(() => {
    return documentsList.filter(file => {
      const name = file.name.toLowerCase();
      return name.includes(search.toLowerCase()) && /\.docx?$/i.test(name);
    });
  }, [documentsList, search]);

  async function loadFiles() {
    setLoading(true);
    try {
      const data = await getAllFiles();
      setFiles({
        documents: data.documents || [],
        photos: data.photos || [],
        tables: data.tables || [],
        backgrounds: data.backgrounds || []
      });
      setBackground(data.settings?.background || data.backgrounds?.[0]?.src || '');
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filtered = useMemo(() => {
    const list = files[activeTab] || [];
    return list.filter(file => file.name.toLowerCase().includes(search.toLowerCase()));
  }, [files, activeTab, search]);

  async function handleUpload(file) {
    try {
      setUploading(true);
      await uploadFile(activeTab, file);
      await loadFiles();
      setNotification({ message: 'Файл сохранён на сервере', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }
  async function handleUploadPdf(file) {
    try {
      setUploading(true);
      await uploadFile('documents', file);
      await loadFiles();
      setNotification({ message: 'PDF документ сохранён на сервере', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }
  async function handleUploadWord(file) {
    try {
      setUploading(true);
      await uploadFile('documents', file);
      await loadFiles();
      setNotification({ message: 'Документ Word сохранён на сервере', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }
  async function handleUploadBackground(file) {
    try {
      setUploading(true);
      await uploadFile('backgrounds', file);
      await loadFiles();
      setNotification({ message: 'Фон загружен на сервер', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(type, file) {
    if (!window.confirm(`Удалить "${file.name}"?`)) return;

    try {
      await deleteFile(type, file.name);
      await loadFiles();
      setNotification({ message: 'Файл удалён', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    }
  }
  async function handleDeleteBackground(file) {
    if (!window.confirm(`Удалить фон «${file.name}»?`)) return;
    try {
      await deleteFile('backgrounds', file.name);
      await loadFiles();
      if (background === file.src) setBackground('');
      setNotification({ message: 'Фон удалён', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    }
  }

  async function handleSelectBackground(file) {
    try {
      await selectBackground(file.src);
      setBackground(file.src);
      setNotification({ message: 'Фон сохранён', type: 'success' });
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    }
  }

  async function openPreview(file) {
    if (file.name.match(/\.pdf$/i)) {
      setPreview({ type: 'pdf', file });
      return;
    }
    if (file.name.match(/\.docx?$/i)) {
      try {
        const urlObj = new URL(file.src);
        const previewSrc = `${urlObj.origin}/api/preview/doc/${encodeURIComponent(file.name)}`;
        setPreview({ type: 'word', file, previewSrc });
      } catch {
        // fallback: если URL некорректен, просто открываем через Office Online Viewer
        setPreview({ type: 'word', file });
      }
      return;
    }

    if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
      try {
        const response = await fetch(file.src);
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setPreview({ type: 'table', file, rows });
      } catch {
        setPreview({ type: 'text', file, text: 'Не удалось открыть таблицу для предпросмотра.' });
      }
      return;
    }

    setPreview({ type: 'text', file, text: 'Предпросмотр для этого типа файла недоступен.' });
  }

  const photoList = files.photos || [];

  return (
    <div className="app" style={{ backgroundImage: background ? `url("${background}")` : 'linear-gradient(135deg, #edf2f7, #dbeafe)' }}>
      {/* Ссылка пропуска к основному содержанию для улучшения доступности */}
      <a href="#main-content" className="skip-link">Перейти к основному содержанию</a>
      <div className="shell">
        <header className="header">
          <div>
            <h1>Цифровой строительный паспорт</h1>
            <p>Документы, фотографии, таблицы и фон сохраняются автоматически на Node.js сервере.</p>
          </div>
        </header>

        {/* Карточка проекта содержит основную информацию и интерфейс выбора фона */}
        <ProjectDetails
          backgrounds={files.backgrounds}
          currentBackground={background}
          onSelectBackground={handleSelectBackground}
          onUploadBackground={handleUploadBackground}
          onDeleteBackground={handleDeleteBackground}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={(key) => { setActiveTab(key); setSearch(''); }} />

        <main className="panel" id="main-content">
          <div className="toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Поиск: ${tabs.find(t => t.key === activeTab)?.title.toLowerCase()}`}
            />
            {/* На вкладке "Документы" блоки загрузки располагаются в каждом разделе, поэтому общий FileUpload не отображаем */}
            {activeTab !== 'documents' && (
              <>
                <FileUpload
                  accept={acceptMap[activeTab]}
                  onFile={handleUpload}
                  label={
                    activeTab === 'photos' ? 'Загрузить фото' :
                    activeTab === 'tables' ? 'Загрузить таблицу' :
                    'Загрузить документ'
                  }
                />
                {uploading && <div className="spinner" aria-label="Загрузка"></div>}
              </>
            )}
          </div>

          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          {loading ? (
            <div className="skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" />)}
            </div>
          ) : (
            <>
              {activeTab === 'documents' && (
                <div className="doc-section">
                  <div className="doc-block">
                    <h3>PDF‑документы</h3>
                    <div className="doc-actions">
                      <FileUpload accept=".pdf" onFile={handleUploadPdf} label="Загрузить PDF" />
                      {uploading && <div className="spinner" aria-label="Загрузка"></div>}
                    </div>
                    {pdfFiles.length > 0 ? (
                      <div className="grid">
                        {pdfFiles.map(file => (
                          <Card
                            key={file.src}
                            title={file.name}
                            onOpen={() => openPreview(file)}
                            onDelete={() => handleDelete('documents', file)}
                            downloadLink={file.src}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty">PDF файлов пока нет. Загрузите первый файл.</div>
                    )}
                  </div>
                  <div className="doc-block">
                    <h3>Word‑документы</h3>
                    <div className="doc-actions">
                      <FileUpload accept=".doc,.docx" onFile={handleUploadWord} label="Загрузить Word" />
                      {uploading && <div className="spinner" aria-label="Загрузка"></div>}
                    </div>
                    {wordFiles.length > 0 ? (
                      <div className="grid">
                        {wordFiles.map(file => (
                          <Card
                            key={file.src}
                            title={file.name}
                            onOpen={() => openPreview(file)}
                            onDelete={() => handleDelete('documents', file)}
                            downloadLink={file.src}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty">Word документов пока нет. Загрузите первый файл.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div className="grid">
                  {filtered.map(file => (
                    <Card
                      key={file.src}
                      title={file.name}
                      image={file.src}
                      onOpen={() => setLightboxIndex(photoList.findIndex(p => p.src === file.src))}
                      onDelete={() => handleDelete('photos', file)}
                      downloadLink={file.src}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'tables' && (
                <div className="grid">
                  {filtered.map(file => (
                    <Card
                      key={file.src}
                      title={file.name}
                      onOpen={() => openPreview(file)}
                      onDelete={() => handleDelete('tables', file)}
                      downloadLink={file.src}
                    />
                  ))}
                </div>
              )}


              {activeTab !== 'documents' && filtered.length === 0 && (
                <div className="empty">Файлов пока нет. Загрузите первый файл.</div>
              )}
            </>
          )}
        </main>
      </div>

      {lightboxIndex !== null && photoList[lightboxIndex] && (
        <Lightbox
          mainSrc={photoList[lightboxIndex].src}
          nextSrc={photoList[(lightboxIndex + 1) % photoList.length]?.src}
          prevSrc={photoList[(lightboxIndex + photoList.length - 1) % photoList.length]?.src}
          imageTitle={photoList[lightboxIndex].name}
          onCloseRequest={() => setLightboxIndex(null)}
          onMovePrevRequest={() => setLightboxIndex((lightboxIndex + photoList.length - 1) % photoList.length)}
          onMoveNextRequest={() => setLightboxIndex((lightboxIndex + 1) % photoList.length)}
        />
      )}

      {preview && (
        <Modal title={preview.file.name} onClose={() => setPreview(null)}>
          {preview.type === 'pdf' && <iframe title={preview.file.name} className="preview-frame" src={preview.file.src} />}
        {preview.type === 'word' && (
          // Если существует ссылкa previewSrc (конвертированный PDF), используем её;
          // иначе пробуем воспользоваться Office Online Viewer
          preview.previewSrc ? (
            <iframe
              title={preview.file.name}
              className="preview-frame"
              src={preview.previewSrc}
            />
          ) : (
            <iframe
              title={preview.file.name}
              className="preview-frame"
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.file.src)}`}
            />
          )
        )}
          {preview.type === 'table' && (
            <div className="table-preview">
              <table>
                <tbody>
                  {preview.rows.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j}>{String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.type === 'text' && <p>{preview.text}</p>}
          <a className="btn" href={preview.file.src} download>Скачать</a>
        </Modal>
      )}
    </div>
  );
}

export default App;
