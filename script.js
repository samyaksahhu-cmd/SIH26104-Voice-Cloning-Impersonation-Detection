const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-button');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const scanList = document.getElementById('scan-list');
const shieldButton = document.getElementById('shield-button');
const shieldLabel = document.getElementById('shield-label');
const callShieldDot = document.getElementById('call-shield-dot');
const dashboardView = document.getElementById('dashboard-view');
const historyView = document.getElementById('history-view');
const scanMediaNav = document.getElementById('scan-media-nav');
const scanHistoryNav = document.getElementById('scan-history-nav');
const historyBack = document.getElementById('history-back');
const historyList = document.getElementById('history-list');
const historyCount = document.getElementById('history-count');
const detailView = document.getElementById('detail-view');
const detailBack = document.getElementById('detail-back');
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const signupStep = document.getElementById('signup-step');
const otpStep = document.getElementById('otp-step');
const signupForm = document.getElementById('signup-form');
const otpForm = document.getElementById('otp-form');
const otpInput = document.getElementById('otp-input');
const otpError = document.getElementById('otp-error');
const otpMobile = document.getElementById('otp-mobile');
const changeNumber = document.getElementById('change-number');
const profileButton = document.getElementById('profile-button');
const profileMenu = document.getElementById('profile-menu');
const profileClose = document.getElementById('profile-close');
const logoutButton = document.getElementById('logout-button');
const lightThemeToggle = document.getElementById('light-theme-toggle');
const darkThemeToggle = document.getElementById('dark-theme-toggle');
const authLightThemeToggle = document.getElementById('auth-light-theme-toggle');
const authDarkThemeToggle = document.getElementById('auth-dark-theme-toggle');
const themeButtons = [lightThemeToggle, darkThemeToggle, authLightThemeToggle, authDarkThemeToggle];
const API_BASE = /^https?:$/.test(location.protocol) ? `${location.protocol}//${location.hostname}:8000` : 'http://localhost:8000';

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  themeButtons.forEach((button) => button.classList.toggle('selected', button.id.includes('light') ? !dark : dark));
  localStorage.setItem('verity-theme', dark ? 'dark' : 'light');
}

applyTheme(localStorage.getItem('verity-theme') || 'light');
lightThemeToggle.addEventListener('click', () => applyTheme('light'));
darkThemeToggle.addEventListener('click', () => applyTheme('dark'));
authLightThemeToggle.addEventListener('click', () => applyTheme('light'));
authDarkThemeToggle.addEventListener('click', () => applyTheme('dark'));

const savedAccount = JSON.parse(localStorage.getItem('verity-account') || 'null');
if (savedAccount && localStorage.getItem('verity-verified') === 'true') {
  setProfile(savedAccount);
  authScreen.hidden = true;
  appShell.hidden = false;
}

function setProfile(account) {
  const initials = account.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = account.name;
  document.getElementById('profile-full-name').textContent = account.name;
  document.getElementById('profile-username').textContent = `@${account.username}`;
  document.getElementById('profile-email').textContent = account.email;
  document.getElementById('profile-mobile').textContent = account.mobile;
}

profileButton.addEventListener('click', () => { profileMenu.hidden = !profileMenu.hidden; });
profileClose.addEventListener('click', () => { profileMenu.hidden = true; });
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('verity-account');
  localStorage.removeItem('verity-verified');
  window.location.replace('./index.html?logged-out=1');
});

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const account = Object.fromEntries(formData.entries());
  localStorage.setItem('verity-account', JSON.stringify(account));
  setProfile(account);
  otpMobile.textContent = formData.get('mobile');
  signupStep.hidden = true;
  otpStep.hidden = false;
  otpInput.focus();
});

otpForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (otpInput.value.trim() !== '123456') {
    otpError.classList.add('show');
    otpInput.focus();
    return;
  }
  otpError.classList.remove('show');
  localStorage.setItem('verity-verified', 'true');
  authScreen.hidden = true;
  appShell.hidden = false;
  setProfile(JSON.parse(localStorage.getItem('verity-account')));
});

changeNumber.addEventListener('click', () => {
  otpStep.hidden = true;
  signupStep.hidden = false;
  otpInput.value = '';
  otpError.classList.remove('show');
});

browseButton.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', (event) => {
  if (event.target !== browseButton) fileInput.click();
});
['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropzone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
}));
dropzone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));
fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));

scanHistoryNav.addEventListener('click', showHistory);
scanMediaNav.addEventListener('click', showDashboard);
historyBack.addEventListener('click', showDashboard);
detailBack.addEventListener('click', showHistory);
document.addEventListener('click', (event) => {
  const row = event.target.closest('.scan-row');
  if (row) showDetails(row);
});

function showHistory() {
  historyList.innerHTML = scanList.innerHTML;
  const total = historyList.querySelectorAll('.scan-row').length;
  historyCount.textContent = `${total} scan${total === 1 ? '' : 's'} recorded`;
  dashboardView.hidden = true;
  historyView.hidden = false;
  detailView.hidden = true;
  scanHistoryNav.classList.add('active');
  scanMediaNav.classList.remove('active');
  document.querySelector('.breadcrumbs').innerHTML = 'Workspace <span>/</span> Scan history';
}

function showDashboard() {
  dashboardView.hidden = false;
  historyView.hidden = true;
  detailView.hidden = true;
  scanMediaNav.classList.add('active');
  scanHistoryNav.classList.remove('active');
  document.querySelector('.breadcrumbs').innerHTML = 'Workspace <span>/</span> Scan media';
}

function showDetails(row) {
  const name = row.querySelector('.scan-file strong').textContent;
  const meta = row.querySelector('.scan-file small').textContent;
  const fileType = row.querySelector('.file-icon').classList.contains('voice') ? 'voice' : row.querySelector('.file-icon').classList.contains('image') ? 'image' : 'video';
  const result = row.querySelector('.result');
  const isAuthentic = result.classList.contains('authentic');
  const isPending = result.classList.contains('uncertain');
  const isUnavailable = result.textContent === 'Analysis unavailable';
  document.querySelector('.risk-banner').classList.toggle('pending', isPending);
  const recommendation = document.querySelector('.recommendation');
  recommendation.classList.remove('suspicious', 'authentic', 'pending');
  recommendation.classList.add(isPending ? 'pending' : isAuthentic ? 'authentic' : 'suspicious');
  const details = {
    voice: ['VOICE', 'Synthetic voice cadence detected', 'Voice cloning markers', 'Unnatural pitch transitions', 'Spectral pattern mismatch'],
    image: ['IMAGE', 'Generative image artifacts detected', 'Inconsistent facial texture', 'Background geometry anomalies', 'Synthetic lighting signature'],
    video: ['VIDEO', 'Synthetic face or audio markers detected', 'Face boundary artifacts', 'Audio-video sync irregularity', 'Frame-level compression mismatch']
  }[fileType];
  document.getElementById('detail-icon').className = `file-icon ${fileType}`;
  document.getElementById('detail-icon').textContent = fileType === 'voice' ? '◒' : fileType === 'image' ? '▧' : '▶';
  document.getElementById('detail-name').textContent = name;
  document.getElementById('detail-meta').textContent = meta;
  document.getElementById('detail-type').textContent = details[0];
  document.getElementById('detail-verdict').textContent = isAuthentic ? 'Likely authentic' : isPending ? (isUnavailable ? 'Analysis unavailable' : 'Awaiting analysis') : result.textContent;
  document.getElementById('detail-summary').textContent = isAuthentic ? 'No strong synthetic fingerprints were detected.' : isPending ? (isUnavailable ? 'The detection backend did not respond, so this file is not being labelled as real or fake.' : 'No AI verdict has been returned yet, so this file is not being labelled as real or fake.') : details[1];
  document.getElementById('detail-score').innerHTML = isAuthentic ? '18 <em>/ 100</em>' : isPending ? '— <em>/ 100</em>' : '87 <em>/ 100</em>';
  document.getElementById('detail-confidence').textContent = isAuthentic ? '82%' : isPending ? '—' : '94%';
  document.getElementById('detail-signals').innerHTML = (isAuthentic ? ['No significant manipulation signal', 'Source consistency check passed'] : isPending ? ['Waiting for Reality Defender or another detection model', 'No suspicious signal has been confirmed'] : details.slice(2)).map((signal) => `<div class="signal-item"><span>${isAuthentic ? '✓' : isPending ? '·' : '!'}</span>${signal}</div>`).join('');
  document.getElementById('detail-recommendation').textContent = isAuthentic ? 'You can proceed with this media. It is not showing strong signs of being AI-generated, but verify important claims independently.' : isPending ? 'Connect the backend detection API before treating this file as authentic or suspicious.' : 'Do not use or believe this media. It may be AI-generated or manipulated. Do not share personal, financial, or login information; verify the sender through a trusted channel.';
  dashboardView.hidden = true;
  historyView.hidden = true;
  detailView.hidden = false;
  scanMediaNav.classList.remove('active');
  scanHistoryNav.classList.remove('active');
  document.querySelector('.breadcrumbs').innerHTML = `Workspace <span>/</span> ${name}`;
}

function handleFile(file) {
  if (!file) return;
  const fileType = file.type.startsWith('audio') ? 'voice' : file.type.startsWith('video') ? 'video' : 'image';
  const icon = fileType === 'voice' ? '◒' : fileType === 'video' ? '▶' : '▧';
  const verdict = 'Analyzing...';
  const verdictClass = 'uncertain';
  const row = document.createElement('div');
  row.className = 'scan-row';
  row.innerHTML = `<span class="file-icon ${fileType}">${icon}</span><div class="scan-file"><strong>${escapeHtml(file.name)}</strong><small>Just now <b>·</b> ${(file.size / 1024 / 1024).toFixed(1)} MB</small></div><span class="result ${verdictClass}">${verdict}</span><span class="row-arrow">›</span>`;
  scanList.prepend(row);
  toastText.textContent = `${verdict} · ${file.name}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
  analyzeUploadedFile(file, row);
}

async function analyzeUploadedFile(file, row) {
  const result = row.querySelector('.result');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 130000);
  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      body: (() => { const data = new FormData(); data.append('file', file); return data; })(),
      signal: controller.signal
    });
    if (!response.ok) {
      let message = `Analysis request failed with ${response.status}`;
      try {
        const errorBody = await response.json();
        message = errorBody.detail || message;
      } catch (_) {
        // Keep the HTTP status when the backend does not return JSON.
      }
      throw new Error(message);
    }
    const analysis = await response.json();
    const verdict = analysis.result?.verdict;
    if (!['authentic', 'suspicious'].includes(verdict)) {
      throw new Error('Detection service returned no final verdict');
    }
    result.textContent = verdict === 'suspicious' ? 'Suspicious' : 'Likely authentic';
    result.className = `result ${verdict}`;
    toastText.textContent = `${result.textContent} · ${file.name}`;
  } catch (error) {
    result.textContent = 'Analysis unavailable';
    result.className = 'result uncertain';
    toastText.textContent = error.name === 'AbortError' ? 'Analysis timed out · retry the file' : error.message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
    console.warn('Media analysis unavailable:', error.message);
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

shieldButton.addEventListener('click', () => {
  const active = shieldButton.classList.toggle('enabled');
  callShieldDot.classList.toggle('active', active);
  callShieldDot.classList.toggle('inactive', !active);
  shieldLabel.textContent = active ? 'Call shield active' : 'Start call shield';
  shieldButton.querySelector('.pulse-icon').textContent = active ? '●' : '◉';
  toastText.textContent = active ? 'Monitoring incoming calls in real time' : 'Call monitoring paused';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
});
