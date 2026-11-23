# 24 Days of Hope – starter project

A static HTML/CSS/JavaScript starter for the j-hope Hungary advent calendar.

## Run locally
1. Open this folder in VS Code.
2. Start `index.html` with Live Server (recommended), or serve the folder with any local static web server.
3. The calendar unlocks according to the visitor's local date in December.

## Preview before December
In `app.js`, temporarily change:
`const unlockedThrough = isDecember ? today.getDate() : 0;`
to:
`const unlockedThrough = 24;`
Restore the original line before publishing.

## Add or edit daily content
Edit `days/1.json` through `days/24.json`.
- `title`: chapter title
- `story`: short introduction
- `surpriseDescription`: what the daily surprise is
- `surpriseUrl`: full official YouTube / Spotify / other link (leave blank until ready)
- `challenge.question`, `challenge.options`, `challenge.answer`: optional quiz

The challenge is optional: opening the day and viewing its story/surprise never depends on answering correctly.

## Important before publishing
- Verify every date, fact, question and answer against reliable/official sources.
- Replace draft notes with final descriptions and add the actual surprise URLs.
- Some draft quiz questions are intentionally left without a fixed answer; complete them before launch.
- Add your Google Analytics measurement ID and event tracking if you want to retain analytics from last year's site.
- `localStorage` remembers opened days on the same browser/device only; it is not a cross-device account system.
- The day order is shuffled on each page load. The number on each door still opens that numbered day's content.
- This is a fan-made project and is not affiliated with BIGHIT MUSIC or HYBE.
