# Family-Building Grant Finder

A searchable directory of fertility grants: application windows, deadlines, decision dates, funding rules, and treatment start rules. Each date is labeled as confirmed, month only, needs confirmation, a recurring pattern, historical, or not announced, and links to the official source.

A free resource from **The Long Way There** podcast:
[Spotify](https://open.spotify.com/show/033jG9beFxNf3xFsLHt7aJ) ·
[Apple Podcasts](https://podcasts.apple.com/us/podcast/the-long-way-there/id6797527430) ·
[YouTube](https://www.youtube.com/@FAITHFERTILITYUS)

This is an independent directory. It isn't affiliated with any program listed and isn't a complete list of every grant. Applying never guarantees an award. Always confirm details with the organization.

## What's here

- `index.html`, `assets/`: the site (plain HTML, CSS, and JavaScript). `index.html` is generated from `index-classic.html` by `tools/build-editorial.mjs`; edit the classic file, then rebuild.
- `data/grants.js`: all grant data. See [UPDATING.md](UPDATING.md).
- `tools/check-data.mjs`: checks the data for mistakes.
- `tools/build-pages.mjs`: builds a page for every grant and every state, plus `sitemap.xml`, so search engines can find them.
- `tools/build-preview.mjs`: builds a private preview that includes programs pending review.
- `index-classic.html`: the source for the home page, and a backup copy of the earlier design (hidden from search engines).
- `grants/`, `states/`: generated pages. Don't edit by hand.

## View it on your computer

Open `index.html` in a browser, or run a small local server from this folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Privacy

Saved grants and application tracking are stored only in each visitor's own browser (localStorage). The site has no accounts, no analytics, and no uploads.
