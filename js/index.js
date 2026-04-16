const usernameInput = document.getElementById('username');
const loadBtn = document.getElementById('loadBtn');
const openFeaturedBtn = document.getElementById('openFeatured');

const statusEl = document.getElementById('status');
const heroTitle = document.getElementById('heroTitle');
const heroText = document.getElementById('heroText');

const featuredRow = document.getElementById('featuredRow');
const pagesRow = document.getElementById('pagesRow');
const homepagesRow = document.getElementById('homepagesRow');

const siteCardTemplate = document.getElementById('siteCardTemplate');

let featuredUrl = '';

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
  return kind === 'GitHub Pages' ? '📺' : '🌐';
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
