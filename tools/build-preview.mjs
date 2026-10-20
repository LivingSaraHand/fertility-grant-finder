// Builds the private preview (public site + programs pending review) into private/preview/.
// Run from the project folder:  node tools/build-preview.mjs
// The preview is what gets published as the private claude.ai artifact.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// --editorial writes the same home page into private/preview-editorial/ (the folder behind the Version 2 preview link).
const variant = process.argv.includes("--editorial") ? "editorial" : "";
const source = "index.html";
const out = path.join(root, variant ? `private/preview-${variant}` : "private/preview");
mkdirSync(path.join(out, "assets"), { recursive: true });
mkdirSync(path.join(out, "data"), { recursive: true });

let html = readFileSync(path.join(root, source), "utf8");
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
for (const f of readdirSync(path.join(root, "assets"))) copyFileSync(path.join(root, "assets", f), path.join(out, "assets", f));
copyFileSync(path.join(root, "data/grants.js"), path.join(out, "data/grants.js"));
if (candidates) copyFileSync(path.join(root, "private/candidates.js"), path.join(out, "data/candidates.js"));
// Grant and state pages, so their links work in the preview too.
for (const dir of ["grants", "states"]) if (existsSync(path.join(root, dir))) cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
console.log(`Preview built in ${path.relative(root, out)}/`);
