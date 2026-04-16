# MemFlix — Animated Memory & Journal Vault

MemFlix is a Netflix-style, animated web app for storing your memories, journals, milestones, and ideas with real timestamps.

## What changed

- Cinematic, animated UI inspired by Netflix cards + a Notion-like writing flow.
- Live clock showing your current local time.
- Rich composer for entries: title, type, timestamp, tags, optional image URL, and body.
- Horizontal "Latest Drops" shelf and a chronological timeline view.
- Search + type filters.
- JSON import/export with an easy schema for SwiftUI Codable compatibility.
- Local persistence using browser localStorage.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## JSON format (SwiftUI-friendly)

You can import either:
- a plain array of entries, or
- an object with an `entries` array.

Example:

```json
{
  "app": "MemFlix",
  "exportedAt": "2026-04-16T00:00:00.000Z",
  "entries": [
    {
      "id": "entry-1",
      "title": "First launch",
      "body": "Shipped my app and celebrated.",
      "type": "Milestone",
      "mediaUrl": "https://example.com/image.jpg",
      "tags": ["launch", "ios"],
      "createdAt": "2026-04-16T10:30:00.000Z",
      "updatedAt": "2026-04-16T10:30:00.000Z"
    }
  ]
}
```
