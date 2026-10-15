import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let selectedFile = null;
let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  await loadProjects();
  initDropzone();
  initUploadAction();
});

async function loadProjects() {
  try {
    const res = await api.get('/projects');
    const projects = Array.isArray(res) ? res : (res?.projects || res?.data || []);
    const select = document.getElementById('upload-project-select');
    select.innerHTML = '';

    if (projects.length === 0) {
      select.innerHTML = '<option value="">No projects available (Create one first)</option>';
      return;
    }

    const savedId = localStorage.getItem('vt_active_project');
    let defaultProj = projects[0];

    projects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = `${p.name} (${p.roomType.replace('_', ' ')})`;
      if (savedId && p._id === savedId) {
        defaultProj = p;
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    currentProject = defaultProj;
    select.value = defaultProj._id;
  } catch (err) {
    UI.toast('Failed to load projects: ' + err.message, 'error');
  }
}

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('video-file-input');

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  document.getElementById('btn-remove-file')?.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    document.getElementById('file-info-container').classList.add('d-none');
    document.getElementById('btn-start-upload').disabled = true;
  });
}

function handleFileSelected(file) {
  const allowedExtensions = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    UI.toast(`Invalid video format (${ext}). Allowed: MP4, WebM, MOV, MKV, AVI`, 'error');
    return;
  }

  const maxSizeBytes = 200 * 1024 * 1024; // 200 MB
  if (file.size > maxSizeBytes) {
    UI.toast(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 200 MB.`, 'error');
    return;
  }

  selectedFile = file;
  document.getElementById('info-file-name').textContent = file.name;
  document.getElementById('info-file-size').textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  document.getElementById('file-info-container').classList.remove('d-none');
  document.getElementById('btn-start-upload').disabled = false;
}

function initUploadAction() {
  const btn = document.getElementById('btn-start-upload');
  const projectSelect = document.getElementById('upload-project-select');

  projectSelect.addEventListener('change', (e) => {
    const projId = e.target.value;
    if (projId) localStorage.setItem('vt_active_project', projId);
  });

  btn.addEventListener('click', async () => {
    if (!selectedFile) {
      UI.toast('Please select a video file first', 'warning');
      return;
    }

    const projectId = projectSelect.value;
    if (!projectId) {
      UI.toast('Please select a project to analyze video for', 'warning');
      return;
    }

    btn.disabled = true;
    const progressContainer = document.getElementById('progress-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const uploadPct = document.getElementById('upload-pct');
    const statusText = document.getElementById('upload-status-text');

    progressContainer.style.display = 'block';
    statusText.textContent = 'Uploading room video to VisionTwin...';

    try {
      // 1. Upload video
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('projectId', projectId);

      const uploadRes = await api.upload('/upload', formData, (percent) => {
        progressBarFill.style.width = `${percent}%`;
        uploadPct.textContent = `${percent}%`;
        if (percent >= 100) {
          statusText.textContent = 'Upload complete! Initializing YOLO detection pipeline...';
        }
      });

      const jobId = uploadRes.analysisJob?._id || uploadRes.analysisJob?.externalJobId;
      UI.toast('Video uploaded and submitted to detection pipeline!', 'success');

      // Redirect to analysis monitor page
      setTimeout(() => {
        window.location.href = `/analysis.html?jobId=${jobId || ''}&projectId=${projectId}`;
      }, 600);
    } catch (err) {
      statusText.textContent = 'Upload or analysis dispatch failed.';
      progressBarFill.style.background = '#ef4444';
      UI.toast(err.message || 'Video analysis failed to start', 'error');
      btn.disabled = false;
    }
  });
}
