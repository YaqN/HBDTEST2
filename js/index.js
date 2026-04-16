const STORAGE_KEY = 'memflix_entries_v2';

const liveClock = document.getElementById('liveClock');
const statusEl = document.getElementById('status');
const focusComposerBtn = document.getElementById('focusComposerBtn');
const openLatestBtn = document.getElementById('openLatestBtn');

const entryTitle = document.getElementById('entryTitle');
const entryType = document.getElementById('entryType');
const entryDateTime = document.getElementById('entryDateTime');
const entryTags = document.getElementById('entryTags');
const entryMediaUrl = document.getElementById('entryMediaUrl');
const entryBody = document.getElementById('entryBody');
const saveEntryBtn = document.getElementById('saveEntryBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');

const latestRow = document.getElementById('latestRow');
const timeline = document.getElementById('timeline');
const composer = document.getElementById('composer');
const entryCardTemplate = document.getElementById('entryCardTemplate');

let entries = loadEntries();
let latestEntry = null;

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function nowLocalInputValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - timezoneOffset);
  return local.toISOString().slice(0, 16);
}

function isoFromInput(value) {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

function formatTime(isoDate) {
  const date = new Date(isoDate);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function relativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function normalizeUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function emptyState(message) {
  const empty = document.createElement('div');
  empty.className = 'empty';
  empty.textContent = message;
  return empty;
}

function cardEmoji(type) {
  if (type === 'Memory') return '📸';
  if (type === 'Journal') return '📔';
  if (type === 'Milestone') return '🏆';
  return '💡';
}

function createCard(entry) {
  const card = entryCardTemplate.content.cloneNode(true);
  const root = card.querySelector('.entry-card');
  const media = card.querySelector('.entry-media');
  const title = card.querySelector('.entry-title');
  const type = card.querySelector('.entry-type');
  const body = card.querySelector('.entry-body');
  const time = card.querySelector('.entry-time');
  const tags = card.querySelector('.entry-tags');

  if (entry.mediaUrl) {
    media.style.background = `center / cover no-repeat url('${entry.mediaUrl}')`;
    media.textContent = '';
  } else {
    media.textContent = cardEmoji(entry.type);
  }

  title.textContent = entry.title;
  type.textContent = entry.type;
  body.textContent = entry.body;
  time.textContent = relativeTime(entry.createdAt);
  tags.textContent = entry.tags.length ? `#${entry.tags.join(' #')}` : 'No tags';

  const open = () => {
    latestEntry = entry;
    openLatestBtn.disabled = false;
    setStatus(`Selected “${entry.title}” from ${formatTime(entry.createdAt)}.`, 'ok');
  };

  root.addEventListener('click', open);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function createTimelineItem(entry) {
  const node = document.createElement('article');
  node.className = 'timeline-item';
  node.innerHTML = `
    <h4>${entry.title}</h4>
    <p>${entry.body}</p>
    <div class="timeline-meta">${entry.type} • ${formatTime(entry.createdAt)} • ${entry.tags.length ? entry.tags.join(', ') : 'no tags'}</div>
  `;
  return node;
}

function getFilteredEntries() {
  const q = searchInput.value.trim().toLowerCase();
  const type = filterType.value;

  return entries.filter((entry) => {
    const matchesType = type === 'All' || entry.type === type;
    const haystack = `${entry.title} ${entry.body} ${entry.tags.join(' ')}`.toLowerCase();
    const matchesQuery = !q || haystack.includes(q);
    return matchesType && matchesQuery;
  });
}

function render() {
  const filtered = getFilteredEntries().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  latestRow.innerHTML = '';
  timeline.innerHTML = '';

  if (!filtered.length) {
    latestRow.appendChild(emptyState('No entries yet. Add your first memory above.'));
    timeline.appendChild(emptyState('Your cinematic timeline will appear here.'));
    openLatestBtn.disabled = true;
    latestEntry = null;
    return;
  }

  filtered.slice(0, 8).forEach((entry) => latestRow.appendChild(createCard(entry)));
  filtered.forEach((entry) => timeline.appendChild(createTimelineItem(entry)));

  latestEntry = filtered[0];
  openLatestBtn.disabled = false;
}

function resetComposer() {
  entryTitle.value = '';
  entryBody.value = '';
  entryTags.value = '';
  entryMediaUrl.value = '';
  entryType.value = 'Memory';
  entryDateTime.value = nowLocalInputValue();
}

function readComposer() {
  const title = entryTitle.value.trim();
  const body = entryBody.value.trim();

  if (!title || !body) {
    setStatus('Please add a title and description for your entry.', 'warn');
    return null;
  }

  return {
    id: crypto.randomUUID(),
    title,
    body,
    type: entryType.value,
    mediaUrl: normalizeUrl(entryMediaUrl.value.trim()),
    tags: parseTags(entryTags.value),
    createdAt: isoFromInput(entryDateTime.value),
    updatedAt: new Date().toISOString()
  };
}

function saveEntry() {
  const entry = readComposer();
  if (!entry) return;

  entries.unshift(entry);
  saveEntries();
  render();
  resetComposer();
  setStatus('Entry saved to your MemFlix vault.', 'ok');
}

function exportEntries() {
  const payload = {
    app: 'MemFlix',
    exportedAt: new Date().toISOString(),
    entries
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'memflix-entries.json';
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus('Exported JSON for backups / SwiftUI import.', 'ok');
}

function importEntries(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = Array.isArray(parsed) ? parsed : parsed.entries;

      if (!Array.isArray(incoming)) {
        throw new Error('Expected JSON array or object with entries array.');
      }

      const normalized = incoming
        .map((entry) => ({
          id: String(entry.id || crypto.randomUUID()),
          title: String(entry.title || '').trim(),
          body: String(entry.body || '').trim(),
          type: String(entry.type || 'Memory').trim() || 'Memory',
          mediaUrl: normalizeUrl(String(entry.mediaUrl || entry.image || '').trim()),
          tags: Array.isArray(entry.tags) ? entry.tags.map(String) : parseTags(String(entry.tags || '')),
          createdAt: new Date(entry.createdAt || entry.date || Date.now()).toISOString(),
          updatedAt: new Date().toISOString()
        }))
        .filter((entry) => entry.title && entry.body);

      entries = [...normalized, ...entries];
      saveEntries();
      render();
      setStatus(`Imported ${normalized.length} entries.`, normalized.length ? 'ok' : 'warn');
    } catch (error) {
      setStatus(`Import failed: ${error.message}`, 'error');
    }
  };

  reader.readAsText(file);
}

function clearAllEntries() {
  entries = [];
  saveEntries();
  render();
  setStatus('Cleared all entries from this browser.', 'warn');
}

function tickClock() {
  const now = new Date();
  liveClock.textContent = now.toLocaleTimeString();
}

focusComposerBtn.addEventListener('click', () => {
  composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  entryTitle.focus();
});

openLatestBtn.addEventListener('click', () => {
  if (!latestEntry) return;
  setStatus(`Latest selected: ${latestEntry.title} (${formatTime(latestEntry.createdAt)}).`, 'ok');
  alert(`${latestEntry.title}\n\n${latestEntry.body}`);
});

saveEntryBtn.addEventListener('click', saveEntry);
exportBtn.addEventListener('click', exportEntries);
clearBtn.addEventListener('click', clearAllEntries);
importFile.addEventListener('change', (event) => {
  importEntries(event.target.files?.[0]);
  event.target.value = '';
});

searchInput.addEventListener('input', render);
filterType.addEventListener('change', render);

resetComposer();
render();
tickClock();
window.setInterval(tickClock, 1000);
