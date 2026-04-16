# GHFLIX (GitHub Website Browser)

A Netflix-like interface for browsing and opening websites from your GitHub projects.

## Features

- Enter a GitHub username and load repository data from the GitHub API.
- Auto-detect website links from:
  - GitHub Pages (`has_pages` repos), and
  - Custom `homepage` URLs.
- Browse sites in horizontally scrollable rows.
- Click any card (or press Enter/Space on it) to open the site.
- Includes a featured section with one-click launch.

## Run

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

You can also preload a username:

```text
http://localhost:8000/?user=your-github-username
```
