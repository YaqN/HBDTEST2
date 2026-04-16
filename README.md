# GHFLIX (GitHub Website Browser)

A Netflix-like interface for browsing and opening websites from your GitHub projects, plus your own uploaded legacy GitHub Pages links.

## Features

- Enter a GitHub username and load repository data from the GitHub API.
- Auto-detect website links from:
  - GitHub Pages (`has_pages` repos), and
  - Custom `homepage` URLs.
- Add older GitHub Pages links manually into an **Uploaded Library** row.
- Import uploaded links via JSON and export your uploaded list back to JSON.
- Persist uploaded entries in browser localStorage.
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

## Upload JSON format

Use a JSON array with objects like:

```json
[
  {
    "repo": "my-old-site",
    "url": "https://yourname.github.io/my-old-site/",
    "description": "Legacy project",
    "type": "Uploaded"
  }
]
```
