
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function getAllFiles() {
  const response = await fetch(`${API}/all-files`);
  if (!response.ok) throw new Error('Не удалось загрузить файлы');
  return response.json();
}

export async function uploadFile(type, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API}/upload/${type}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Не удалось загрузить файл');
  return response.json();
}

export async function deleteFile(type, name) {
  const response = await fetch(`${API}/files/${type}/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });

  if (!response.ok) throw new Error('Не удалось удалить файл');
  return response.json();
}

export async function selectBackground(src) {
  const response = await fetch(`${API}/background/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src })
  });

  if (!response.ok) throw new Error('Не удалось сохранить фон');
  return response.json();
}
export async function getProject() {
  const response = await fetch(`${API}/project`);
  if (!response.ok) throw new Error('Не удалось загрузить данные проекта');
  return response.json();
}
export async function updateProject(data) {
  const response = await fetch(`${API}/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Не удалось сохранить данные проекта');
  return response.json();
}
