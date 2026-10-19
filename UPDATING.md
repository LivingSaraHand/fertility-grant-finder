# Updating Fertility Grant Finder

All grant information lives in one file: `data/grants.js`. The site reads it directly. There's no build step for the public site.

## The easy way

Ask Claude in this folder, for example:

- "Recheck Baby Quest and update the site."
- "Gift of Parenthood confirmed the Q4 deadline is December 31. Update it."
- "Approve Starfish and Conceive from the review list."
- "Here's a new grant: <link>. Research it and add it for my review."

Claude edits `data/grants.js`, runs the checker, and publishes.

## Rules for every edit

1. **Never change an old cycle's dates to make it a new year.** Add a new cycle record instead. Past cycles stay as they were and move to the archive automatically after their deadline.
2. **Use `null` for anything unknown.** The site shows "Not announced" or "Not yet verified".
3. **Only use `"date"` when the official source gives a day and a year.** If only the month is known, use `"month": "2027-03"`.
4. **When official pages disagree**, keep one date and list the other under `"alternatives"` with its source. The site labels it "Needs confirmation".
5. **Recurring schedules are text, not dates.** Put "opens every April" in `recurring_text` on an `"awaiting"` cycle. Don't turn it into a date.
6. **Only set `last_verified_at` to the day you actually rechecked the official source.**
7. **Don't mark a cycle open just because a site has an Apply button.** Set `open_verified_on` only when the page clearly says this specific cycle is accepting applications.

## Adding a new cycle when a program announces dates

Copy an existing cycle inside that organization's `"cycles"` list, give it a new `id` (for example `baby-quest-2027-fall`), set `"kind": "dated"`, and fill in only the dates the source states. If there was an `"awaiting"` placeholder for that cycle, replace it.

Date format examples:

```js
"submission_deadline_at": { "date": "2027-09-02", "time": "17:00", "tz": "America/New_York", "tz_label": "ET" }
"application_opens_at": { "month": "2027-06" }
"notification_date": null
```

`deadline_basis` is one of `submitted`, `receipt`, `postmark`, or `unknown`.

## Check your edit

```bash
node tools/check-data.mjs
```

It reports missing fields, badly formatted dates, unknown time zones, and dates whose year doesn't match the cycle.

## Rebuild the grant and state pages

Every grant has its own page (`grants/<id>/`) and every state has one (`states/<state>/`), so people can find the site on Google. They're generated from `data/grants.js`. After any data change, rebuild them:

```bash
node tools/build-pages.mjs
```

This also rewrites `sitemap.xml`. Never edit files in `grants/` or `states/` by hand; they're replaced on every build.

## Publish

```bash
git add -A && git commit -m "Update grant dates" && git push
```

GitHub Pages updates the public site a minute or two after the push.

## Private files

`private/` is never published (it's listed in `.gitignore`):

- `private/candidates.js`: programs found during research, waiting for your approval.
- `private/research-inbox.md`: links and leads to look into later.
- `private/update-log.md`: what each scheduled check found and changed.
- `private/preview/`: the private preview build (`node tools/build-preview.mjs`), which also shows programs pending review.
- `private/brand/`: full-size logo originals. The site uses the smaller copies in `assets/`.
