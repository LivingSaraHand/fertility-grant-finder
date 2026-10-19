// Builds the private preview (public site + programs pending review) into private/preview/.
// Run from the project folder:  node tools/build-preview.mjs
// The preview is what gets published as the private claude.ai artifact.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "private/preview");
mkdirSync(path.join(out, "assets"), { recursive: true });
mkdirSync(path.join(out, "data"), { recursive: true });

let html = readFileSync(path.join(root, "index.html"), "utf8");
// The artifact host supplies its own document wrapper, so drop ours.
html = html
  .replace(/<!doctype html>\s*/i, "")
  .replace(/<html[^>]*>\s*/i, "")
  .replace(/<\/html>\s*/i, "")
  .replace(/<head>\s*/i, "")
  .replace(/<\/head>\s*/i, "")
  .replace(/<body>\s*/i, "")
  .replace(/<\/body>\s*/i, "")
  .replace(/<meta charset="utf-8">\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "");
const candidates = existsSync(path.join(root, "private/candidates.js"));
html = html.replace(
  '<script src="data/grants.js"></script>',
  '<script>window.FGF_PREVIEW = true;</script>\n<script src="data/grants.js"></script>' + (candidates ? '\n<script src="data/candidates.js"></script>' : "")
);
writeFileSync(path.join(out, "index.html"), html);
copyFileSync(path.join(root, "assets/app.js"), path.join(out, "assets/app.js"));
copyFileSync(path.join(root, "assets/styles.css"), path.join(out, "assets/styles.css"));
copyFileSync(path.join(root, "data/grants.js"), path.join(out, "data/grants.js"));
if (candidates) copyFileSync(path.join(root, "private/candidates.js"), path.join(out, "data/candidates.js"));
console.log("Preview built in private/preview/");
