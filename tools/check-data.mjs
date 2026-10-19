// Checks data/grants.js (and private/candidates.js if present) for mistakes.
// Run from the project folder:  node tools/check-data.mjs
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(root, "data/grants.js"), "utf8"), ctx);
const cand = path.join(root, "private/candidates.js");
if (existsSync(cand)) vm.runInContext(readFileSync(cand, "utf8"), ctx);

const data = ctx.window.FGF_DATA;
const candidates = ctx.window.FGF_CANDIDATES || [];
const errors = [];
const warnings = [];

const KINDS = ["dated", "rolling", "awaiting", "event", "paused"];
const CONF = ["confirmed", "month_only", "needs_confirmation", "recurring", "historical", "not_announced"];
const BASIS = ["submitted", "receipt", "postmark", "unknown"];
const DATE_KEYS = ["application_opens_at", "start_application_deadline_at", "submission_deadline_at", "notification_date", "funds_available_date", "event_date"];
const ORG_REQUIRED = ["id", "name", "program_name", "official_url", "program_type", "geography", "treatments_covered", "award_min", "award_max", "application_fee", "eligibility_notes", "cycles", "source_urls", "last_verified_at", "verification_status", "research_notes"];
const CYCLE_REQUIRED = ["id", "cycle_label", "cycle_year", "kind", "application_opens_at", "start_application_deadline_at", "submission_deadline_at", "deadline_basis", "notification_date", "notification_window_text", "funds_available_date", "treatment_start_rule", "expiration_rule", "date_confidence", "source_url"];

const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
const isMonth = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

function checkDate(where, d) {
  if (d == null) return;
  if (typeof d !== "object") { errors.push(`${where}: must be an object or null`); return; }
  if (!d.date && !d.month) errors.push(`${where}: needs "date" or "month" (use null if unknown)`);
  if (d.date && !isISO(d.date)) errors.push(`${where}: bad date "${d.date}" (use YYYY-MM-DD)`);
  if (d.month && !isMonth(d.month)) errors.push(`${where}: bad month "${d.month}" (use YYYY-MM)`);
  if (d.time && !isTime(d.time)) errors.push(`${where}: bad time "${d.time}" (use 24-hour HH:MM)`);
  if (d.tz) { try { new Intl.DateTimeFormat("en-US", { timeZone: d.tz }); } catch { errors.push(`${where}: unknown timezone "${d.tz}"`); } }
  if (d.confidence && !CONF.includes(d.confidence)) errors.push(`${where}: unknown confidence "${d.confidence}"`);
  (d.alternatives || []).forEach((a, i) => { if (!a.date || !isISO(a.date)) errors.push(`${where}.alternatives[${i}]: bad date`); if (!a.source) warnings.push(`${where}.alternatives[${i}]: say which source shows this date`); });
}

function checkOrgs(list, label) {
  const ids = new Set();
  const cycleIds = new Set();
  list.forEach((o) => {
    const w = `${label} ${o.id || "(no id)"}`;
    ORG_REQUIRED.forEach((k) => { if (!(k in o)) errors.push(`${w}: missing "${k}"`); });
    if (ids.has(o.id)) errors.push(`${w}: duplicate organization id`);
    ids.add(o.id);
    if (o.last_verified_at && !isISO(o.last_verified_at)) errors.push(`${w}: bad last_verified_at`);
    if (o.award_min === 0 || o.award_max === 0) warnings.push(`${w}: award of 0. Use null if unknown.`);
    if (!Array.isArray(o.links) || !o.links.length) warnings.push(`${w}: no "links" for the details view`);
    (o.links || []).forEach((l, i) => { if (!l.label || !/^https:\/\//.test(l.url || "")) errors.push(`${w}.links[${i}]: needs a label and an https:// url`); });
    if (!o.requirements) warnings.push(`${w}: no "requirements" summary`);
    else {
      const TRI = ["married", "us_citizen", "us_status", "diagnosis", "no_children", "employment", "health_insurance", "attend_event"];
      TRI.forEach((k) => { const v = o.requirements[k]; if (!(v === true || v === false || v === null || v === "some")) errors.push(`${w}.requirements.${k}: use true, false, "some", or null`); });
      ["children_max", "age_min", "age_max", "income_max"].forEach((k) => { const v = o.requirements[k]; if (!(v === null || Number.isFinite(v))) errors.push(`${w}.requirements.${k}: use a number or null`); });
    }
    (o.cycles || []).forEach((c) => {
      const cw = `${w} / ${c.id || "(no id)"}`;
      CYCLE_REQUIRED.forEach((k) => { if (!(k in c)) errors.push(`${cw}: missing "${k}"`); });
      if (cycleIds.has(c.id)) errors.push(`${cw}: duplicate cycle id`);
      cycleIds.add(c.id);
      if (!KINDS.includes(c.kind)) errors.push(`${cw}: unknown kind "${c.kind}"`);
      if (!CONF.includes(c.date_confidence)) errors.push(`${cw}: unknown date_confidence "${c.date_confidence}"`);
      if (c.deadline_basis && !BASIS.includes(c.deadline_basis)) errors.push(`${cw}: unknown deadline_basis "${c.deadline_basis}"`);
      DATE_KEYS.forEach((k) => checkDate(`${cw}.${k}`, c[k]));
      if (c.kind === "event" && !c.event_date) errors.push(`${cw}: event cycles need event_date`);
      if (c.kind === "awaiting" && (c.submission_deadline_at || c.application_opens_at)) warnings.push(`${cw}: awaiting cycle has dates. Should it be "dated"?`);
      if (c.cycle_year != null) {
        const years = DATE_KEYS.map((k) => c[k]).filter(Boolean).map((d) => (d.date || d.month).slice(0, 4)).map(Number);
        if (years.some((y) => Math.abs(y - c.cycle_year) > 1)) warnings.push(`${cw}: a date's year is far from cycle_year ${c.cycle_year}. Check for a copied old date.`);
      }
      if (c.open_verified_on && !isISO(c.open_verified_on)) errors.push(`${cw}: bad open_verified_on`);
    });
  });
  return { ids, cycleIds };
}

const pub = checkOrgs(data.organizations, "grant");
const priv = checkOrgs(candidates, "candidate");
priv.ids.forEach((id) => { if (pub.ids.has(id)) warnings.push(`candidate ${id}: already published. Remove it from private/candidates.js.`); });
(data.resources || []).forEach((r) => { if (!r.url || !r.name) errors.push(`resource ${r.id}: needs name and url`); });

console.log(`${data.organizations.length} organizations, ${data.organizations.reduce((n, o) => n + o.cycles.length, 0)} cycles, ${(data.resources || []).length} resources, ${candidates.length} candidates pending review.`);
warnings.forEach((w) => console.log("warning: " + w));
errors.forEach((e) => console.log("ERROR: " + e));
if (errors.length) { console.log(`${errors.length} error(s).`); process.exit(1); }
console.log("Data looks good.");
