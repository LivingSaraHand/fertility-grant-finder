// Builds the home page (index.html, the "warm editorial" design) from index-classic.html.
// index-classic.html is the source: edit it, then run this. The finder, tracker, calendar, and every fix stay shared;
// only the header and the top of the Find page change. index-classic.html stays online as a backup of the older design.
// Run from the project folder:  node tools/build-editorial.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let html = readFileSync(path.join(root, "index-classic.html"), "utf8");

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
  </div>
` + html.slice(navStart);

// Hero with a simple two-question search, then "Start exploring" paths.
swap(`    <h2 id="find-title" class="visually-hidden">Find grants</h2>
`, `    <section class="ed-hero" aria-labelledby="ed-title">
      <p class="ed-tag">A little support. A way forward.</p>
      <h1 id="ed-title" class="ed-title">Fertility Grant Finder</h1>
      <p class="ed-sub">Find grants that help pay for IVF, IUI, donor conception, surrogacy, and adoption, with every deadline in one place.</p>
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
