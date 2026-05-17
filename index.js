const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }
}));

const uploadsRoot = path.join(__dirname, 'uploads');
const settingsPath = path.join(__dirname, 'settings.json');
const projectPath = path.join(__dirname, 'project.json');

const folders = {
  documents: path.join(uploadsRoot, 'documents'),
  photos: path.join(uploadsRoot, 'photos'),
  tables: path.join(uploadsRoot, 'tables'),
  backgrounds: path.join(uploadsRoot, 'backgrounds')
};

Object.values(folders).forEach(folder => fs.mkdirSync(folder, { recursive: true }));
function decodeUnicodeEscape(str) {
  return str.replace(/#U([0-9A-Fa-f]{4})/g, (_, code) => {
    const num = parseInt(code, 16);
    return String.fromCharCode(num);
  });
}

function safeName(name) {
  const decoded = decodeUnicodeEscape(name);
  return path.basename(decoded).replace(/[<>:"/\\|?*]+/g, '_');
}

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return { background: '' };
  }
}

function getProject() {
  try {
    return JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  } catch {
    return {
      name: '',
      address: '',
      startDate: '',
      endDate: '',
      status: '',
      responsible: ''
    };
  }
}


function saveProject(updates) {
  const current = getProject();
  const merged = { ...current, ...updates };
  fs.writeFileSync(projectPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

function fileInfo(type, filename, baseUrl) {
  const displayName = decodeUnicodeEscape(filename);
  return {
    name: displayName,
    src: `${baseUrl}/uploads/${type}/${encodeURIComponent(filename)}`
  };
}

app.use('/uploads', express.static(uploadsRoot));

app.get('/api/project', (req, res) => {
  try {
    const project = getProject();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/project', (req, res) => {
  try {
    const updates = req.body || {};
    const project = saveProject(updates);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/:type', (req, res) => {
  const { type } = req.params;
  const folder = folders[type];

  if (!folder) {
    return res.status(400).json({ error: 'Unknown file type' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  fs.readdir(folder, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      files
        .filter((f) => !f.startsWith('.'))
        .map((f) => fileInfo(type, f, baseUrl))
    );
  });
});

app.get('/api/all-files', async (req, res) => {
  const result = {};
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  for (const type of Object.keys(folders)) {
    const files = fs
      .readdirSync(folders[type])
      .filter((f) => !f.startsWith('.'));
    result[type] = files.map((f) => fileInfo(type, f, baseUrl));
  }
  result.settings = getSettings();
  res.json(result);
});

app.post('/api/upload/:type', (req, res) => {
  const { type } = req.params;
  const folder = folders[type];

  if (!folder) {
    return res.status(400).json({ error: 'Unknown file type' });
  }

  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploaded = req.files.file;
  const files = Array.isArray(uploaded) ? uploaded : [uploaded];
  const saved = [];
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const allowedExts = {
    documents: ['.pdf', '.doc', '.docx', '.xlsx', '.xls'],
    photos: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    tables: ['.xlsx', '.xls', '.csv'],
    backgrounds: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  };

  const allowed = allowedExts[type] || [];

  for (const file of files) {
    const originalName = file.name;
    const name = safeName(originalName);
    const ext = path.extname(name).toLowerCase();
    if (allowed.length && !allowed.includes(ext)) {
      return res.status(400).json({ error: `Неподдерживаемый тип файла: ${ext}` });
    }
    let finalName = name;
    let targetPath = path.join(folder, finalName);
    let counter = 1;
    while (fs.existsSync(targetPath)) {
      const base = path.parse(name).name;
      const extension = path.extname(name);
      finalName = `${base}(${counter})${extension}`;
      targetPath = path.join(folder, finalName);
      counter++;
    }
    try {
      file.mv(targetPath);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка сохранения файла' });
    }
    saved.push(fileInfo(type, finalName, baseUrl));
  }
  if (type === 'backgrounds' && saved[0]) {
    const settings = getSettings();
    const fullSrc = saved[0].src;
    const relativeSrc = fullSrc.startsWith(baseUrl)
      ? fullSrc.slice(baseUrl.length)
      : fullSrc;
    settings.background = relativeSrc;
    saveSettings(settings);
  }

  res.json(saved);
});

app.delete('/api/files/:type/:name', (req, res) => {
  const { type, name } = req.params;
  const folder = folders[type];

  if (!folder) {
    return res.status(400).json({ error: 'Unknown file type' });
  }

  const decodedName = safeName(decodeURIComponent(name));
  const targetPath = path.join(folder, decodedName);

  if (!targetPath.startsWith(folder)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }

  const settings = getSettings();
  if (settings.background && settings.background.includes(encodeURIComponent(decodedName))) {
    settings.background = '';
    saveSettings(settings);
  }

  res.json({ ok: true });
});

app.post('/api/background/select', (req, res) => {
  const { src } = req.body;
  const settings = getSettings();
  if (src) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    settings.background = src.startsWith(baseUrl) ? src.slice(baseUrl.length) : src;
  } else {
    settings.background = '';
  }
  saveSettings(settings);
  res.json(settings);
});

app.get('/api/background', (req, res) => {
  res.json(getSettings());
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});
