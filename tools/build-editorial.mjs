// Builds the home page (index.html, the "warm editorial" design) from index-classic.html.
// index-classic.html is the source: edit it, then run this. The finder, tracker, calendar, and every fix stay shared;
// only the header and the top of the Find page change. index-classic.html stays online as a backup of the older design.
// Run from the project folder:  node tools/build-editorial.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let html = readFileSync(path.join(root, "index-classic.html"), "utf8");
const dataCtx = { window: {} };
vm.createContext(dataCtx);
vm.runInContext(readFileSync(path.join(root, "data/grants.js"), "utf8"), dataCtx);
const PODCAST_LINKS = dataCtx.window.FGF_DATA.meta.credit.links || [];
const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// "Listen" links to the podcast, shown in the top bar of every page.
const headphones = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>';
const listenHTML = (links) => `<nav class="listen" aria-label="Listen to the podcast"><span class="listen-label">${headphones} Listen:</span> ${links
  .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${l.label === "Apple Podcasts" ? 'Apple<span class="lp-long"> Podcasts</span>' : esc(l.label)}</a>`)
  .join('<span class="listen-sep" aria-hidden="true">·</span>')}</nav>`;


const swap = (from, to) => {
  if (!html.includes(from)) throw new Error("build-editorial: could not find:\n" + from.slice(0, 120));
  html = html.replace(from, to);
};

// The classic copy is hidden from search engines; the home page isn't.
swap('<meta name="robots" content="noindex">\n', "");
swap("<body>", '<body class="editorial">');
// The hero title is the page's main heading, so the hidden "Find grants" heading isn't needed here.
swap(`<section id="view-find" class="view" aria-labelledby="find-title">`, `<section id="view-find" class="view" aria-labelledby="ed-title">`);

// Light header: logo and podcast name, then the menu.
const headStart = html.indexOf('<header class="site-head">');
const navStart = html.indexOf('  <nav class="tabs wrap"', headStart);
html = html.slice(0, headStart) + `<header class="site-head">
  <div class="wrap ed-top">
    <a class="ed-brand" href="#find">
      <span class="logo-badge" id="logo-badge" hidden><img id="brand-logo" alt="The Long Way There logo" width="72" height="72"></span>
      <span class="ed-brand-text">The Long Way There<small>A free resource from the podcast</small></span>
    </a>
    ${listenHTML(PODCAST_LINKS)}
  </div>
` + html.slice(navStart);

// Hero with a simple two-question search, then "Start exploring" paths.
swap(`    <h2 id="find-title" class="visually-hidden">Find grants</h2>
`, `    <section class="ed-hero" aria-labelledby="ed-title">
      <p class="ed-tag">Different paths. Support along the&nbsp;way.</p>
      <h1 id="ed-title" class="ed-title">Family-Building Grant Finder</h1>
      <p class="ed-sub">Explore grants that can help with the cost of fertility treatment, donor conception, surrogacy, and adoption. Find eligibility details, application dates, and next steps—all in one place.</p>
      <form class="ed-form" id="ed-form">
        <div class="field">
          <label for="ed-state">Where you live</label>
          <select id="ed-state"><option value="">All states</option></select>
        </div>
        <div class="field">
          <label for="ed-path">What you're exploring</label>
          <select id="ed-path">
            <option value="">All family-building paths</option>
            <option value="IVF">IVF</option>
            <option value="IUI">IUI</option>
            <option value="FET">Frozen embryo transfer</option>
            <option value="Donor eggs/sperm">Donor conception</option>
            <option value="Surrogacy">Surrogacy</option>
            <option value="Embryo donation/adoption">Embryo adoption</option>
            <option value="Egg freezing">Egg freezing</option>
            <option value="Adoption">Adoption</option>
          </select>
        </div>
        <button type="submit" class="btn ed-go">Find grants →</button>
      </form>
    </section>

    <section class="ed-paths" aria-labelledby="ed-paths-title">
      <div class="ed-sectionline"><h2 id="ed-paths-title">Start exploring</h2><small>Browse at your own pace</small></div>
      <div class="ed-cards">
        <button type="button" class="ed-card" data-path="IVF">
          <span class="ed-mini">Fertility treatment</span>
          <span class="ed-card-title">Help with IVF</span>
          <span class="ed-card-text">Grants for IVF, frozen embryo transfer, and related costs.</span>
          <span class="ed-card-foot"><span data-path-count="IVF">Browse this path</span><span aria-hidden="true">↗</span></span>
        </button>
        <button type="button" class="ed-card" data-path="Donor eggs/sperm">
          <span class="ed-mini">More ways to build a family</span>
          <span class="ed-card-title">Donor conception</span>
          <span class="ed-card-text">Support for donor eggs, donor sperm, and embryo donation.</span>
          <span class="ed-card-foot"><span data-path-count="Donor eggs/sperm">Browse this path</span><span aria-hidden="true">↗</span></span>
        </button>
        <button type="button" class="ed-card" data-path="Adoption">
          <span class="ed-mini">Your next chapter</span>
          <span class="ed-card-title">Adoption support</span>
          <span class="ed-card-text">Funding for adoption expenses.</span>
          <span class="ed-card-foot"><span data-path-count="Adoption">Browse this path</span><span aria-hidden="true">↗</span></span>
        </button>
      </div>
    </section>
`);

// "Not sure you qualify?": a quiet link under the hero search. The questions stay next to the results they filter.
swap(`        <button type="submit" class="btn ed-go">Find grants →</button>
      </form>`, `        <button type="submit" class="btn ed-go">Find grants →</button>
      </form>
      <p class="ed-qualify"><a href="#req-check" data-open-req>Not sure you qualify? Check requirements →</a></p>`);

// A visible heading above the full list.
swap(`    <div class="searchbar">`, `    <div class="ed-sectionline" id="ed-all"><h2>All grants</h2><small>Search, filter, and save</small></div>
    <div class="searchbar">`);

writeFileSync(path.join(root, "index.html"), html);
console.log("Built index.html from index-classic.html");
