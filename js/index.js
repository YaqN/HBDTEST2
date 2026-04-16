const usernameInput = document.getElementById('username');
const loadBtn = document.getElementById('loadBtn');
const openFeaturedBtn = document.getElementById('openFeatured');

const uploadTitleInput = document.getElementById('uploadTitle');
const uploadUrlInput = document.getElementById('uploadUrl');
const uploadTypeInput = document.getElementById('uploadType');
const uploadDescInput = document.getElementById('uploadDesc');
const addUploadBtn = document.getElementById('addUploadBtn');
const uploadFileInput = document.getElementById('uploadFile');
const exportUploadsBtn = document.getElementById('exportUploadsBtn');
const clearUploadsBtn = document.getElementById('clearUploadsBtn');

const statusEl = document.getElementById('status');
const heroTitle = document.getElementById('heroTitle');
const heroText = document.getElementById('heroText');

const uploadedRow = document.getElementById('uploadedRow');
const featuredRow = document.getElementById('featuredRow');
const pagesRow = document.getElementById('pagesRow');
const homepagesRow = document.getElementById('homepagesRow');

const siteCardTemplate = document.getElementById('siteCardTemplate');

const UPLOAD_STORAGE_KEY = 'ghflix_uploaded_sites';

let featuredUrl = '';
let uploadedSites = loadUploadedSites();

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function normalizeUrl(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function githubPagesUrl(owner, repo) {
  return `https://${owner}.github.io/${repo}/`;
}

function openWebsite(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function cardEmoji(kind) {
  if (kind === 'GitHub Pages') return '📺';
  if (kind === 'Uploaded') return '📁';
  return '🌐';
}

function createSiteCard(site) {
  const card = siteCardTemplate.content.cloneNode(true);
  const root = card.querySelector('.site-card');
  const thumb = card.querySelector('.site-card__thumb');
  const title = card.querySelector('.site-card__title');
  const desc = card.querySelector('.site-card__desc');
  const type = card.querySelector('.site-card__type');

  thumb.textContent = cardEmoji(site.type);
  title.textContent = site.repo;
  desc.textContent = site.description || 'No description provided.';
  type.textContent = site.type;

  const open = () => openWebsite(site.url);
  root.addEventListener('click', open);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function renderRow(targetRow, items) {
  targetRow.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No items found in this category.';
    targetRow.appendChild(empty);
    return;
  }

  items.forEach((item) => targetRow.appendChild(createSiteCard(item)));
}

function collectWebsites(repos, owner) {
  const websites = [];

  repos.forEach((repo) => {
    if (repo.has_pages) {
      websites.push({
        repo: repo.name,
        description: repo.description,
        type: 'GitHub Pages',
        url: githubPagesUrl(owner, repo.name)
      });
    }

    const homepage = normalizeUrl(repo.homepage);
    if (homepage) {
      websites.push({
        repo: repo.name,
        description: repo.description,
        type: 'Custom Homepage',
        url: homepage
      });
    }
  });

  return websites;
}

function updateHero(username, websites) {
  if (websites.length === 0) {
    heroTitle.textContent = `${username}'s library is empty`;
    heroText.textContent = 'No GitHub Pages or homepage links were found.';
    featuredUrl = '';
    openFeaturedBtn.disabled = true;
    return;
  }

  const featured = websites[0];
  featuredUrl = featured.url;
  openFeaturedBtn.disabled = false;

  heroTitle.textContent = `Featured: ${featured.repo}`;
  heroText.textContent = `${featured.type} • Click “Open Featured Site” or select any card below.`;
}

function loadUploadedSites() {
  const raw = localStorage.getItem(UPLOAD_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUploadedSites() {
  localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(uploadedSites));
}

function renderUploadedSites() {
  renderRow(uploadedRow, uploadedSites);
}

function readUploadForm() {
  const repo = uploadTitleInput.value.trim();
  const url = normalizeUrl(uploadUrlInput.value.trim());
  const description = uploadDescInput.value.trim();
  const type = uploadTypeInput.value;

  if (!repo || !url) {
    setStatus('Please provide at least a project title and URL for uploaded entries.', 'warn');
    return null;
  }

  return {
    repo,
    url,
    description,
    type
  };
}

function resetUploadForm() {
  uploadTitleInput.value = '';
  uploadUrlInput.value = '';
  uploadDescInput.value = '';
  uploadTypeInput.value = 'Uploaded';
}

function addUploadedSite() {
  const site = readUploadForm();
  if (!site) return;

  uploadedSites.unshift(site);
  saveUploadedSites();
  renderUploadedSites();
  resetUploadForm();
  setStatus('Uploaded site saved to your local GHFLIX library.', 'ok');
}

function importUploadedSites(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of site entries.');

      const normalized = parsed
        .map((entry) => ({
          repo: String(entry.repo || entry.title || '').trim(),
          url: normalizeUrl(String(entry.url || '').trim()),
          description: String(entry.description || '').trim(),
          type: String(entry.type || 'Uploaded').trim() || 'Uploaded'
        }))
        .filter((entry) => entry.repo && entry.url);

      uploadedSites = [...normalized, ...uploadedSites];
      saveUploadedSites();
      renderUploadedSites();
      setStatus(`Imported ${normalized.length} uploaded site entr${normalized.length === 1 ? 'y' : 'ies'}.`, normalized.length ? 'ok' : 'warn');
    } catch (error) {
      setStatus(`Import failed: ${error.message}`, 'error');
    }
  };

  reader.readAsText(file);
}

function exportUploadedSites() {
  const payload = JSON.stringify(uploadedSites, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ghflix-uploads.json';
  anchor.click();
  URL.revokeObjectURL(url);

  setStatus('Exported uploaded sites to ghflix-uploads.json.', 'ok');
}

function clearUploadedSites() {
  uploadedSites = [];
  saveUploadedSites();
  renderUploadedSites();
  setStatus('Cleared uploaded sites from this browser.', 'warn');
}

async function loadLibrary() {
  const username = usernameInput.value.trim();
  if (!username) {
    setStatus('Enter a GitHub username first.', 'warn');
    return;
  }

  setStatus('Loading your website library...');

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

    const repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('Unexpected API response.');

    const websites = collectWebsites(repos, username);
    const pages = websites.filter((item) => item.type === 'GitHub Pages');
    const custom = websites.filter((item) => item.type === 'Custom Homepage');

    renderRow(featuredRow, websites);
    renderRow(pagesRow, pages);
    renderRow(homepagesRow, custom);
    updateHero(username, websites);

    setStatus(`Loaded ${websites.length} clickable website entr${websites.length === 1 ? 'y' : 'ies'}.`, websites.length ? 'ok' : 'warn');
  } catch (error) {
    setStatus(`Failed to load library: ${error.message}`, 'error');
    renderRow(featuredRow, []);
    renderRow(pagesRow, []);
    renderRow(homepagesRow, []);
    updateHero(username, []);
  }
}

loadBtn.addEventListener('click', loadLibrary);
addUploadBtn.addEventListener('click', addUploadedSite);
exportUploadsBtn.addEventListener('click', exportUploadedSites);
clearUploadsBtn.addEventListener('click', clearUploadedSites);
uploadFileInput.addEventListener('change', (event) => {
  importUploadedSites(event.target.files?.[0]);
  event.target.value = '';
});

usernameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadLibrary();
});

openFeaturedBtn.addEventListener('click', () => {
  if (featuredUrl) openWebsite(featuredUrl);
});

const urlParams = new URLSearchParams(window.location.search);
const presetUser = urlParams.get('user');
if (presetUser) {
  usernameInput.value = presetUser;
  loadLibrary();
}

renderUploadedSites();
