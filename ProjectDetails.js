import React, { useState, useEffect } from 'react';
import { getProject, updateProject } from '../api';
import FileUpload from './FileUpload';
export default function ProjectDetails({ backgrounds, currentBackground, onSelectBackground, onUploadBackground, onDeleteBackground, onProjectChange }) {
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statuses = ['Проектирование', 'Строительство', 'Завершение', 'Работа'];
  useEffect(() => {
    async function load() {
      try {
        const data = await getProject();
        setProject(data);
        setForm(data);
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных проекта');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  async function handleSave() {
    if (!form.name || !form.name.trim() || !form.status || !form.status.trim()) {
      setError('Пожалуйста, заполните обязательные поля: название и статус');
      return;
    }
    try {
      const updated = await updateProject(form);
      setProject(updated);
      setForm(updated);
      setEditing(false);
      setError('');
      if (onProjectChange) onProjectChange(updated);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить данные');
    }
  }

  if (loading) {
    return <div className="project-card"><p>Загрузка данных проекта...</p></div>;
  }
  if (error && !editing) {
    return <div className="project-card"><p className="error">{error}</p></div>;
  }
  const nameError = editing && (!form.name || !form.name.trim());
  const statusError = editing && (!form.status || !form.status.trim());
  const normalize = (src) => {
    try {
      const url = new URL(src, window.location.origin);
      return url.pathname + url.search + url.hash;
    } catch {
      return src;
    }
  };

  return (
    <div className="project-card">
      {project && !editing && (
        <>
          <h2>{project.name || 'Название проекта не указано'}</h2>
          <div className="project-info">
            {project.address && <p><strong>Адрес:</strong> {project.address}</p>}
            {project.startDate && <p><strong>Дата начала:</strong> {project.startDate}</p>}
            {project.endDate && <p><strong>Дата окончания:</strong> {project.endDate}</p>}
            {project.status && <p><strong>Статус:</strong> {project.status}</p>}
            {project.responsible && <p><strong>Ответственный:</strong> {project.responsible}</p>}
          </div>
          <button className="edit-btn" onClick={() => setEditing(true)}>Редактировать</button>
        </>
      )}

      {editing && (
        <div className="project-edit">
          <div className="form-group">
            <label>Название<span aria-hidden="true">*</span></label>
            <input
              type="text"
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              className={nameError ? 'error-field' : ''}
            />
          </div>
          <div className="form-group">
            <label>Адрес</label>
            <input type="text" name="address" value={form.address || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Дата начала</label>
            <input type="date" name="startDate" value={form.startDate || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Дата окончания</label>
            <input type="date" name="endDate" value={form.endDate || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Статус<span aria-hidden="true">*</span></label>
            <select
              name="status"
              value={form.status || ''}
              onChange={handleChange}
              className={statusError ? 'error-field' : ''}
            >
              <option value="">Выберите статус</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ответственный</label>
            <input type="text" name="responsible" value={form.responsible || ''} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button className="btn" onClick={handleSave}>Сохранить</button>
            <button className="btn" onClick={() => { setEditing(false); setForm(project); }}>Отмена</button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {/* Блок выбора фона */}
      {backgrounds && backgrounds.length > 0 && (
        <div className="backgrounds-section">
          <h3>Фон приложения</h3>
          <div className="backgrounds-list">
            {backgrounds.map(bg => {
              const isSelected = normalize(currentBackground) === normalize(bg.src);
              return (
                <div key={bg.src} className="background-item">
                  <button
                    className={`background-thumb ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectBackground(bg)}
                    title="Выбрать фон"
                  >
                    <img src={bg.src} alt={bg.name} />
                  </button>
                  {onDeleteBackground && (
                    <button
                      className="delete-background-btn"
                      onClick={(e) => { e.stopPropagation(); onDeleteBackground(bg); }}
                      title="Удалить фон"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Блок загрузки нового фона */}
      {onUploadBackground && (
        <div className="background-upload">
          <FileUpload accept="image/*" onFile={onUploadBackground} label="Загрузить фон" />
        </div>
      )}
    </div>
  );
}