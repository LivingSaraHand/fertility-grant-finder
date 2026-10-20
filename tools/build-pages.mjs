// Builds a page for every grant and every U.S. state, plus index pages, sitemap.xml, and robots.txt.
// These are plain HTML pages that search engines can read, generated from data/grants.js.
// Run from the project folder after any data change:  node tools/build-pages.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
ctx.globalThis = ctx.window;
vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(root, "assets/core.js"), "utf8").replace("typeof window !== \"undefined\" ? window : globalThis", "window"), ctx);
vm.runInContext(readFileSync(path.join(root, "data/grants.js"), "utf8"), ctx);
const C = ctx.window.FGF_CORE;
const DATA = ctx.window.FGF_DATA;
const { esc, fmtDate, fmtMonth, fmtTime, STATE_NAMES, CONF_LABEL, CONF_HELP, STATUS_LABEL, GROUP_OF } = C;

const SITE = DATA.meta.site_url.replace(/\/?$/, "/");
const UPDATED = DATA.meta.data_updated;
const BUILD_DAY = UPDATED; // statuses are recomputed in each visitor's browser; this is only the fallback
const V = "15";
const ORGS = DATA.organizations;
const nameSort = (a, b) => a.name.localeCompare(b.name);
const stateSlug = (code) => C.slug(STATE_NAMES[code]);
const STATES = Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b]));

// ---------- Shared bits ----------
function chip(conf) {
  return `<span class="chip c-${conf}" title="${esc(CONF_HELP[conf] || "")}">${esc(CONF_LABEL[conf] || conf)}</span>`;
}
function pill(c) {
  const st = C.cycleStatus(c, BUILD_DAY);
  return `<span class="pill s-${st}" data-round-id="${esc(c.id)}">${esc(STATUS_LABEL[st])}</span>`;
}
function dateHTML(d, c, opts = {}) {
  if (!d) return `<span class="dv na">${esc(opts.na || "Not announced")}</span>`;
  let main;
  if (d.date) {
    main = fmtDate(d.date, { weekday: opts.weekday });
    if (d.time) main += ", " + fmtTime(d.time) + (d.tz_label ? " " + d.tz_label : "");
  } else {
    main = fmtMonth(d.month) + (d.time ? ", " + fmtTime(d.time) : "") + ' <span class="muted">(day not announced)</span>';
  }
  if (d.alternatives && d.alternatives.length) main += ' <span class="muted">or</span> ' + d.alternatives.map((a) => fmtDate(a.date)).join(" or ");
  let html = `<span class="dv">${main}</span>${chip(C.dateConf(d, c))}`;
  if (opts.basis) html += `<span class="muted">${esc(opts.basis)}</span>`;
  if (opts.notes && d.note) html += `<span class="sub">${esc(d.note)}</span>`;
  if (opts.notes && d.alternatives) html += `<span class="sub">${d.alternatives.map((a) => `${esc(fmtDate(a.date))}: ${esc(a.source || "")}`).join("; ")}</span>`;
  return html;
}
function basisText(c) {
  return { postmark: "Postmark deadline", receipt: "Must be received", submitted: "Submit online" }[c.deadline_basis] || "Deadline type not stated";
}
function ledger(c) {
  const rows = [];
  const text = (t) => `<span>${esc(t)}</span>`;
  const na = (t) => `<span class="dv na">${esc(t || "Not announced")}</span>`;
  if (c.kind === "rolling") {
    rows.push(["Applications", `<span class="dv">Accepted year-round</span>`]);
    if (c.notification_window_text) rows.push(["Decisions", text(c.notification_window_text)]);
  } else if (c.kind === "awaiting" || c.kind === "paused") {
    rows.push(["Next dates", na("Not announced yet") + chip(c.date_confidence === "recurring" ? "recurring" : (c.kind === "paused" ? "needs_confirmation" : "not_announced"))]);
    if (c.recurring_text) rows.push(["Past pattern", text(c.recurring_text)]);
  } else if (c.kind === "event") {
    rows.push(["Event", dateHTML(c.event_date, c, { weekday: true, notes: true })]);
    if (c.notification_window_text) rows.push(["Selection", text(c.notification_window_text)]);
  } else {
    rows.push(["Opens", dateHTML(c.application_opens_at, c, { notes: true, na: c.open_verified_on ? `Accepting applications (as of ${fmtDate(c.open_verified_on)})` : "Not announced" })]);
    if (c.start_application_deadline_at) rows.push(["Start by", dateHTML(c.start_application_deadline_at, c, { notes: true })]);
    rows.push(["Deadline", dateHTML(c.submission_deadline_at, c, { weekday: true, notes: true, basis: c.submission_deadline_at ? basisText(c) : null }), true]);
    rows.push(["Decisions", c.notification_date ? dateHTML(c.notification_date, c, { notes: true }) : (c.notification_window_text ? text(c.notification_window_text) : na())]);
    rows.push(["Funds", c.funds_available_date ? dateHTML(c.funds_available_date, c, {}) : (c.funds_available_text ? text(c.funds_available_text) : na())]);
    rows.push(["Start treatment", c.treatment_start_rule ? text(c.treatment_start_rule) : na("Not yet verified")]);
    rows.push(["Use funds by", c.expiration_rule ? text(c.expiration_rule) : na("Not yet verified")]);
  }
  return `<dl class="ledger">${rows.map(([k, v, key]) => `<dt${key ? ' class="key"' : ""}>${esc(k)}</dt><dd${key ? ' class="key"' : ""}>${v}</dd>`).join("")}</dl>`;
}
function reqTable(o) {
  const r = o.requirements || {};
  const val = (v) => (v === true ? "Required" : v === false ? "Not required" : v === "some" ? "Required for some applicants" : null);
  const rows = [
    ["Legally married", val(r.married)],
    ["U.S. citizenship", r.us_citizen === false && r.us_status === true ? "Not required (residents can apply)" : val(r.us_citizen)],
    ["U.S. citizen or permanent/legal resident", val(r.us_status)],
    ["Infertility diagnosis", val(r.diagnosis)],
    ["No children already", r.children_max != null && r.no_children !== true ? `Up to ${r.children_max} ${r.children_max === 1 ? "child" : "children"} allowed` : val(r.no_children)],
    ["Someone in the household employed", val(r.employment)],
    ["Health insurance", val(r.health_insurance)],
    ["Attend an event in person", val(r.attend_event)],
    ["Age", r.age_min != null || r.age_max != null ? (r.age_min != null && r.age_max != null ? `${r.age_min} to ${r.age_max}` : r.age_min != null ? `${r.age_min} or older` : `${r.age_max} or younger`) : null],
    ["Household income", r.income_max != null ? `Up to ${C.fmtMoney(r.income_max, "USD")}` : null]
  ];
  const other = (r.other || []).length ? `<ul>${r.other.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  return `<dl class="req-table">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd${v ? "" : ' class="ns"'}>${esc(v || "Not stated")}</dd>`).join("")}</dl>${other}`;
}
function list(arr) {
  return arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted">Not yet verified.</p>`;
}
// Most useful round to show in summaries: open first, then upcoming, rolling, to be announced, then the latest past round.
function featuredRound(o) {
  const order = { open: 0, upcoming: 1, rolling: 2, tba: 3, check: 3, paused: 4, pending: 5, closed: 6 };
  return o.cycles.slice().sort((a, b) => order[C.cycleStatus(a, BUILD_DAY)] - order[C.cycleStatus(b, BUILD_DAY)] || String(C.dEarliest(a.submission_deadline_at) || "9999").localeCompare(String(C.dEarliest(b.submission_deadline_at) || "9999")))[0];
}
function keyDateLine(c) {
  if (c.kind === "rolling") return "Applications accepted year-round";
  if (c.kind === "event" && c.event_date) return "Event: " + (c.event_date.date ? fmtDate(c.event_date.date) : fmtMonth(c.event_date.month));
  const s = c.submission_deadline_at, o = c.application_opens_at;
  if (s) return "Deadline: " + (s.date ? fmtDate(s.date) + (s.alternatives ? " or " + s.alternatives.map((a) => fmtDate(a.date)).join(" or ") : "") : fmtMonth(s.month) + " (day not announced)") + ` (${CONF_LABEL[C.dateConf(s, c)]})`;
  if (o) return "Opens: " + (o.date ? fmtDate(o.date) : fmtMonth(o.month) + " (day not announced)") + ` (${CONF_LABEL[C.dateConf(o, c)]})`;
  return "Dates not announced yet";
}
function grantItem(o, base) {
  const c = featuredRound(o);
  const req = C.reqShort(o.requirements);
  return `<article class="card">
    <div class="card-top">${pill(c)}<span class="cycle-tag">${esc(c.cycle_label)}</span></div>
    <div class="card-title"><h3 class="card-h"><a href="${base}grants/${o.id}/">${esc(o.name)}</a></h3><p class="card-sub">${esc(o.program_name)}</p></div>
    <p class="key-line">${esc(keyDateLine(c))}</p>
    <div class="card-meta"><span class="meta-tag">${esc(C.awardText(o) === "Not announced" ? "Award not announced" : C.awardText(o))}</span><span class="meta-tag">${esc(o.application_fee === 0 ? "No fee" : o.application_fee == null ? "Fee not announced" : C.feeText(o) + " fee")}</span><span class="meta-tag">${esc(C.geoShort(o))}</span>${C.clinicKind(o) === "yes" ? '<span class="meta-tag">Partner clinic required</span>' : ""}${((o.requirements && o.requirements.welcomes) || []).includes("lgbtq") ? '<span class="meta-tag">Welcomes LGBTQ+ families</span>' : ""}${((o.requirements && o.requirements.welcomes) || []).includes("single") ? '<span class="meta-tag">Open to single applicants</span>' : ""}${(o.requirements && o.requirements.only) === "cancer" ? '<span class="meta-tag">People with cancer only</span>' : ((o.requirements && o.requirements.welcomes) || []).includes("cancer") ? '<span class="meta-tag">For people with cancer</span>' : ""}${(o.requirements && o.requirements.only) === "military" ? '<span class="meta-tag">Veterans only</span>' : ((o.requirements && o.requirements.welcomes) || []).includes("military") ? '<span class="meta-tag">For veterans</span>' : ""}</div>
    <p class="req-line">${req.length ? `<strong>Requires:</strong> ${esc(req.join(", "))}` : "Requirements not fully published. Check their website."}</p>
    <p class="src-line"><a href="${base}grants/${o.id}/">Dates, requirements, and links</a> · ${esc(C.verifiedText(o))}</p>
  </article>`;
}

function page({ base, pathName, title, description, h1, crumbs, body, jsonld, rounds }) {
  const url = SITE + pathName;
  const m = DATA.meta;
  const credit = (m.credit.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ");
  const crumbsHTML = crumbs.map(([label, href], i) => (href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join(' <span aria-hidden="true">›</span> ');
  const ld = [{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map(([label, href], i) => ({ "@type": "ListItem", position: i + 1, name: label, item: href ? new URL(href, url).href : url })) }].concat(jsonld || []);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fertility Grant Finder">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}assets/logo.png">
<link rel="icon" href="${base}assets/logo-road.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap">
<link rel="stylesheet" href="${base}assets/styles.css?v=${V}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-inner">
    <a class="logo-badge" href="${base}"><img src="${base}assets/logo.png" alt="Fertility Grant Finder home" width="96" height="96"></a>
    <div class="head-text">
      <p class="eyebrow">A free resource from ${esc(m.credit.show_name)} podcast</p>
      <p class="brand-name"><a href="${base}">Fertility Grant Finder</a></p>
    </div>
  </div>
  <nav class="tabs wrap" aria-label="Sections">
    <a href="${base}#find">Find grants</a>
    <a href="${base}states/"${pathName.startsWith("states/") ? ' aria-current="page"' : ""}>Grants by state</a>
    <a href="${base}grants/"${pathName.startsWith("grants/") ? ' aria-current="page"' : ""}>All grants</a>
    <a href="${base}#calendar">Calendar</a>
    <a href="${base}#about">About</a>
  </nav>
</header>
<main id="main" class="wrap page">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbsHTML}</nav>
  <h1 class="page-title">${esc(h1)}</h1>
  ${body}
  <p class="page-disclaimer">Fertility Grant Finder is an independent directory and isn't affiliated with any program listed. It isn't a complete list of every grant, and applying never guarantees an award. Always confirm details with the organization before you apply. Information last updated ${esc(fmtDate(UPDATED))}.</p>
</main>
<footer class="site-foot">
  <div class="wrap foot-inner">
    <div class="foot-brand"><img id="foot-logo" src="${base}assets/logo-road.png" alt="" width="40" height="40"><p class="credit">${esc(m.credit.line)} <span class="muted">Listen on</span> ${credit}</p></div>
    <p class="foot-small"><a href="${base}">Find grants</a> · <a href="${base}states/">Grants by state</a> · <a href="${base}grants/">All grants</a> · <a href="${base}#about">About</a></p>
  </div>
</footer>
${rounds ? `<script type="application/json" id="rounds">${JSON.stringify(rounds).replace(/</g, "\\u003c")}</script>
<script src="${base}assets/core.js?v=${V}"></script>
<script src="${base}assets/page.js?v=${V}"></script>` : ""}
</body>
</html>
`;
}

// Rounds embedded so each visitor's browser recomputes "Open now" and similar labels for today's date.
function roundsFor(orgs) {
  const out = {};
  orgs.forEach((o) => o.cycles.forEach((c) => { out[c.id] = c; }));
  return out;
}

// ---------- Grant pages ----------
function grantPage(o) {
  const base = "../../";
  const rounds = o.cycles.slice().sort((a, b) => (GROUP_OF[C.cycleStatus(a, BUILD_DAY)] === "archive") - (GROUP_OF[C.cycleStatus(b, BUILD_DAY)] === "archive"));
  const g = o.geography || {};
  const where = g.type === "us_national"
    ? `<p>Open to applicants in every U.S. state. <a href="${base}states/">See grants by state</a>.</p>`
    : (g.states || []).length
      ? `<p>${esc(g.text || "")}</p><p>State pages: ${g.states.map((s) => `<a href="${base}states/${stateSlug(s)}/">${esc(STATE_NAMES[s])}</a>`).join(", ")}</p>`
      : `<p>${esc(g.text || "Not stated.")}</p>`;
  const award = C.awardText(o);
  const description = `${o.program_name} from ${o.name}: ${award === "Not announced" ? "award not announced" : award}, ${C.feeText(o).toLowerCase() === "no fee" ? "no application fee" : "application fee " + C.feeText(o)}, ${C.geoShort(o)}. Application dates, requirements, and official links, checked ${fmtDate(o.last_verified_at || UPDATED)}.`;
  const body = `
  <p class="page-lede">${esc(o.program_name)} · ${esc(o.program_type)}</p>
  <div class="dlg-actions">
    ${o.application_url ? `<a class="btn btn-primary" href="${esc(o.application_url)}" target="_blank" rel="noopener">Official application page</a>` : ""}
    <a class="btn" href="${base}#grant-${o.id}">Save or track in the finder</a>
  </div>
  <div class="facts page-facts">
    <div><span>Award</span><span>${esc(o.award_text || award)}</span></div>
    <div><span>Application fee</span><span>${esc(o.fee_text || C.feeText(o))}</span></div>
    <div><span>Where</span><span>${esc(g.text || C.geoShort(o))}</span></div>
    <div><span>Clinic</span><span>${esc(o.clinic_restrictions || C.clinicShort(o))}</span></div>
    ${((o.requirements && o.requirements.welcomes) || []).length ? `<div><span>Who it serves</span><span>${esc(o.requirements.welcomes.map((x) => ({ single: "Open to single applicants", lgbtq: "Welcomes LGBTQ+ families", cancer: "People with cancer", military: "Veterans and service members" })[x]).join(", "))}</span></div>` : ""}
    ${o.decision_speed ? `<div><span>How fast they decide</span><span>${esc(o.decision_speed.text)}</span></div>` : ""}
    <div><span>Treatments mentioned</span><span>${esc((o.treatments_covered || []).map(C.treatLabel).join(", ") || "Not yet verified")}</span></div>
    <div><span>Last checked</span><span>${esc(C.verifiedText(o))}</span></div>
  </div>
  <section class="detail-section"><h2>Application rounds</h2>
    <p class="note">Each round keeps its own dates. Labels show how certain each date is.</p>
    ${rounds.map((c) => `<div class="cycle-block"><h3>${esc(c.cycle_label)} ${pill(c)}</h3>${ledger(c)}${c.status_note ? `<p class="note">${esc(c.status_note)}</p>` : ""}<p class="note"><a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source for this round</a></p></div>`).join("")}
  </section>
  <section class="detail-section"><h2>Requirements at a glance</h2>
    <p class="note">From the organization's published rules. "Not stated" means we couldn't find it, not that there's no rule. Only the organization can decide whether you qualify.</p>
    ${reqTable(o)}
  </section>
  <section class="detail-section"><h2>Review eligibility</h2>${list(o.eligibility_notes)}</section>
  <section class="detail-section"><h2>What's covered and not covered</h2>${list(o.coverage_notes)}</section>
  <section class="detail-section"><h2>Where this grant is available</h2>${where}</section>
  <section class="detail-section"><h2>More details on their website</h2>
    <div class="link-list">${(o.links || [{ label: "Official website", url: o.official_url }]).map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>
    <p class="ask-line">Have a question about eligibility, dates, or fees? Ask ${esc(o.name)} directly: <a href="${esc(C.questionLink(o).url)}" target="_blank" rel="noopener">${esc(C.questionLink(o).label === "Website" ? "visit their website" : C.questionLink(o).label)}</a>.</p>
  </section>
  ${(o.research_notes || []).length ? `<section class="detail-section"><h2>Research notes</h2>${list(o.research_notes)}</section>` : ""}`;
  return page({
    base, pathName: `grants/${o.id}/`,
    title: `${o.name}: ${o.program_name} deadlines and requirements | Fertility Grant Finder`,
    description, h1: o.name,
    crumbs: [["Fertility Grant Finder", base], ["All grants", `${base}grants/`], [o.name, null]],
    body, rounds: roundsFor([o])
  });
}

// ---------- State pages ----------
function statePage(code) {
  const base = "../../";
  const name = STATE_NAMES[code];
  const local = ORGS.filter((o) => (o.geography && o.geography.states || []).includes(code)).sort(nameSort);
  const national = ORGS.filter((o) => o.geography && o.geography.type === "us_national").sort(nameSort);
  const unknown = ORGS.filter((o) => !o.geography || o.geography.type === "unknown").filter((o) => !local.includes(o)).sort(nameSort);
  const nLocal = local.length, nNat = national.length;
  const intro = nLocal
    ? `${nLocal} ${nLocal === 1 ? "grant is" : "grants are"} limited to ${name} or nearby areas, and ${nNat} nationwide ${nNat === 1 ? "grant accepts" : "grants accept"} applicants from ${name}.`
    : `We haven't found a grant limited to ${name} yet. These ${nNat} nationwide grants accept applicants from ${name}.`;
  const others = STATES.filter((s) => s !== code).map((s) => `<a href="${base}states/${stateSlug(s)}/">${esc(STATE_NAMES[s])}</a>`).join("");
  const body = `
  <p class="page-lede">${esc(intro)} Every date is labeled by how certain it is, with links to official sources.</p>
  <div class="dlg-actions"><a class="btn btn-primary" href="${base}#state-${code}">Open the finder for ${esc(name)}</a></div>
  ${nLocal ? `<section class="detail-section"><h2>Grants for ${esc(name)} residents</h2><p class="note">These are limited to certain states, areas, or partner clinics. Check each grant's location rules.</p><div class="cards">${local.map((o) => grantItem(o, base)).join("")}</div></section>` : ""}
  <section class="detail-section"><h2>Nationwide grants open to ${esc(name)} residents</h2><div class="cards">${national.map((o) => grantItem(o, base)).join("")}</div></section>
  ${unknown.length ? `<section class="detail-section"><h2>Grants that don't say where they accept applicants</h2><p class="note">Check each organization's eligibility before applying.</p><div class="cards">${unknown.map((o) => grantItem(o, base)).join("")}</div></section>` : ""}
  <section class="detail-section tips"><h2>Before you apply</h2>
    <ul>
      <li>Most grants pay your clinic or agency directly and won't cover treatment that has already started.</li>
      <li>Many grants don't cover fertility medications. Ask your clinic about medication savings programs.</li>
      <li>Confirm every date on the organization's own website. Dates marked "Needs confirmation" or "Not announced" can change.</li>
    </ul>
  </section>
  <section class="detail-section"><h2>Other states</h2><div class="state-grid">${others}</div></section>`;
  return page({
    base, pathName: `states/${stateSlug(code)}/`,
    title: `Fertility grants in ${name}: IVF, IUI, and family-building grants | Fertility Grant Finder`,
    description: `Fertility and IVF grants that accept ${name} residents: ${nLocal ? nLocal + " local and " : ""}${nNat} nationwide programs, with deadlines, requirements, and official links. Checked ${fmtDate(UPDATED)}.`,
    h1: `Fertility grants in ${name}`,
    crumbs: [["Fertility Grant Finder", base], ["Grants by state", `${base}states/`], [name, null]],
    body, rounds: roundsFor([...local, ...national, ...unknown])
  });
}

function statesIndex() {
  const base = "../";
  const national = ORGS.filter((o) => o.geography && o.geography.type === "us_national").length;
  const rows = STATES.map((s) => {
    const n = ORGS.filter((o) => (o.geography && o.geography.states || []).includes(s)).length;
    return `<a href="${s ? `${stateSlug(s)}/` : ""}">${esc(STATE_NAMES[s])}${n ? ` <span class="state-count">${n} local</span>` : ""}</a>`;
  }).join("");
  const body = `<p class="page-lede">Pick your state to see local grants plus the ${national} nationwide grants that accept applicants everywhere in the U.S.</p>
  <div class="state-grid big">${rows}</div>
  <p class="note">Grants outside the U.S. are listed on the <a href="${base}grants/">All grants</a> page.</p>`;
  return page({
    base, pathName: "states/",
    title: "Fertility grants by state | Fertility Grant Finder",
    description: `Find fertility and IVF grants for your state, plus ${national} nationwide programs. Deadlines, requirements, and official links, checked ${fmtDate(UPDATED)}.`,
    h1: "Fertility grants by state",
    crumbs: [["Fertility Grant Finder", base], ["Grants by state", null]],
    body
  });
}

function grantsIndex() {
  const base = "../";
  const sorted = ORGS.slice().sort(nameSort);
  const body = `<p class="page-lede">${sorted.length} grant programs, each with its own page of dates, requirements, and official links. For search and filters, use <a href="${base}#find">the finder</a>.</p>
  <div class="cards">${sorted.map((o) => grantItem(o, base)).join("")}</div>`;
  return page({
    base, pathName: "grants/",
    title: "All fertility grants: IVF, IUI, surrogacy, and adoption | Fertility Grant Finder",
    description: `${sorted.length} fertility grant programs with deadlines, requirements, fees, and official links. Each date is labeled confirmed or not yet announced. Checked ${fmtDate(UPDATED)}.`,
    h1: "All fertility grants",
    crumbs: [["Fertility Grant Finder", base], ["All grants", null]],
    body, rounds: roundsFor(sorted)
  });
}

// ---------- Write everything ----------
for (const dir of ["grants", "states"]) {
  const p = path.join(root, dir);
  if (existsSync(p)) rmSync(p, { recursive: true });
}
const write = (rel, html) => {
  const p = path.join(root, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, html);
};
const urls = [""];
ORGS.forEach((o) => { write(`grants/${o.id}/index.html`, grantPage(o)); urls.push(`grants/${o.id}/`); });
STATES.forEach((s) => { write(`states/${stateSlug(s)}/index.html`, statePage(s)); urls.push(`states/${stateSlug(s)}/`); });
write("grants/index.html", grantsIndex()); urls.push("grants/");
write("states/index.html", statesIndex()); urls.push("states/");

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${UPDATED}</lastmod></url>`).join("\n")}
</urlset>
`);
// robots.txt only takes effect at a domain's root. On a project site it's harmless and ready for a custom domain.
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`Built ${ORGS.length} grant pages, ${STATES.length} state pages, 2 index pages, sitemap.xml (${urls.length} URLs).`);
