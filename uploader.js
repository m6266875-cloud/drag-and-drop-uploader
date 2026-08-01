
function saveToStorage(items){
  localStorage.setItem('contactSheetFrames', JSON.stringify(items));
}
function loadFromStorage(){
  return JSON.parse(localStorage.getItem('contactSheetFrames') || '[]');
}

/* ---------------------------------------------------------------- */

const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('fileInput');
const sheet      = document.getElementById('contactSheet');
const errorBanner= document.getElementById('errorBanner');
const errorText  = document.getElementById('errorText');
const errorClose = document.getElementById('errorClose');
const frameCount = document.getElementById('frameCount');
const clearBtn   = document.getElementById('clearBtn');
const emptyNote  = document.getElementById('emptyNote');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_EXT   = ['jpg', 'jpeg', 'png', 'gif'];

let frameSeq = 0;
let errorTimer = null;

/* ---------- drag & drop wiring ---------- */
['dragenter', 'dragover'].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  })
);
['dragleave', 'dragend'].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
  })
);
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-active');
  handleFiles(e.dataTransfer.files);
});
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

errorClose.addEventListener('click', hideError);
clearBtn.addEventListener('click', () => {
  sheet.innerHTML = '';
  saveToStorage([]);
  updateCount();
});

/* ---------- validation ---------- */
function isValidImage(file){
  const ext = file.name.split('.').pop().toLowerCase();
  const extOk = ALLOWED_EXT.includes(ext);
  const typeOk = ALLOWED_TYPES.includes(file.type);
  return extOk || typeOk;
}

/* ---------- error banner ---------- */
function showError(names){
  errorText.innerHTML = names.length === 1
    ? `<span>${names[0]}</span> isn't a JPG, PNG, or GIF.`
    : `<span>${names.length} files</span> skipped — only JPG, PNG, and GIF are accepted.`;
  errorBanner.hidden = false;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(hideError, 5000);
}
function hideError(){
  errorBanner.hidden = true;
  clearTimeout(errorTimer);
}

/* ---------- main handler ---------- */
function handleFiles(fileList){
  const files = Array.from(fileList);
  const rejected = [];

  files.forEach(file => {
    if (!isValidImage(file)) {
      rejected.push(file.name);
      return;
    }
    readAndCreateFrame(file);
  });

  if (rejected.length) showError(rejected);
}

function readAndCreateFrame(file){
  const reader = new FileReader();
  reader.onload = e => {
    const item = {
      id: ++frameSeq,
      name: file.name,
      size: file.size,
      dataUrl: e.target.result
    };
    saveToStorage([...loadFromStorage(), item]);
    renderFrame(item, false);
  };
  reader.readAsDataURL(file);
}

/* ---------- rendering + simulated upload ---------- */
function renderFrame(item, alreadyDeveloped){
  emptyNote.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'frame';
  el.dataset.id = item.id;
  el.innerHTML = `
    <div class="frame-photo">
      <span class="tape pink center"></span>
      <span class="frame-number">${String(item.id).padStart(3,'0')}</span>
      <button class="remove-btn" aria-label="Remove ${item.name}">×</button>
      <img src="${item.dataUrl}" alt="${item.name}">
    </div>
    <div class="frame-meta">
      <span class="frame-name">${item.name}</span>
      <div class="progress-track"><div class="progress-fill"></div></div>
      <div class="progress-label"><span class="stage-label">uploading…</span><span class="pct">0%</span></div>
    </div>
  `;
  sheet.prepend(el);

  el.querySelector('.remove-btn').addEventListener('click', () => {
    el.remove();
    saveToStorage(loadFromStorage().filter(i => i.id !== item.id));
    updateCount();
  });

  if (alreadyDeveloped) {
    el.classList.add('developed');
    el.querySelector('.pct').textContent = '100%';
    el.querySelector('.stage-label').textContent = 'added';
  } else {
    simulateUpload(el);
  }
  updateCount();
}

function simulateUpload(frameEl){
  const fill = frameEl.querySelector('.progress-fill');
  const pct  = frameEl.querySelector('.pct');
  const label= frameEl.querySelector('.stage-label');
  let progress = 0;

  function tick(){
    progress = Math.min(100, progress + (6 + Math.random() * 16));
    fill.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';

    if (progress < 100) {
      setTimeout(tick, 150 + Math.random() * 250);
    } else {
      label.textContent = 'added';
      setTimeout(() => frameEl.classList.add('developed'), 150);
    }
  }
  setTimeout(tick, 200);
}

function updateCount(){
  frameCount.textContent = sheet.children.length;
  emptyNote.style.display = sheet.children.length ? 'none' : 'block';
}

/* ---------- restore saved photos on load ---------- */
loadFromStorage().forEach(item => renderFrame(item, true));
