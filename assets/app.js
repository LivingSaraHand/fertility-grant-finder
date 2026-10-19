/* Fertility Grant Finder — app logic. Data lives in data/grants.js. */
(function () {
  "use strict";

  const DATA = window.FGF_DATA;
  const PREVIEW = !!window.FGF_PREVIEW;
  const CANDIDATES = PREVIEW && Array.isArray(window.FGF_CANDIDATES) ? window.FGF_CANDIDATES : [];

  // ---------- Constants ----------
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const STATE_NAMES = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
    MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
    PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
    WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
  };
  const CONF_LABEL = {
    confirmed: "Confirmed",
    month_only: "Month only",
    needs_confirmation: "Needs confirmation",
    recurring: "Recurring pattern",
    historical: "Historical",
    not_announced: "Not announced"
  };
  const CONF_HELP = {
    confirmed: "An exact date, with the year, published by the organization.",
    month_only: "The organization announced the month and year, but not the day.",
    needs_confirmation: "Official pages disagree or leave something out. Both versions are shown.",
    recurring: "A schedule the organization has used before. Not a confirmed date for this year.",
    historical: "Past information kept for reference.",
    not_announced: "Nothing has been published yet."
  };
  const STATUS_LABEL = {
    open: "Open now", upcoming: "Upcoming", rolling: "Rolling", tba: "Dates to be announced",
    check: "Check source", paused: "Paused", pending: "Closed, decisions pending", closed: "Closed"
  };
  const BASIS_LABEL = { submitted: "submitted online", receipt: "received by", postmark: "postmarked by", unknown: "basis not stated" };
  const EVENT_TYPES = [
    { key: "application_opens_at", label: "Applications open", short: "Opens", color: "var(--ev-open)" },
    { key: "start_application_deadline_at", label: "Last day to start an application", short: "Start by", color: "var(--ev-start)" },
    { key: "submission_deadline_at", label: "Submission deadline", short: "Due", color: "var(--ev-submit)" },
    { key: "notification_date", label: "Decisions expected", short: "Decisions", color: "var(--ev-decision)" },
    { key: "funds_available_date", label: "Funds available", short: "Funds", color: "var(--ev-funds)" },
    { key: "event_date", label: "Grant event", short: "Event", color: "var(--ev-event)" }
  ];
  const TRACK_STATUSES = [
    ["researching", "Researching"], ["checking", "Checking eligibility"], ["preparing", "Preparing"], ["submitted", "Submitted"],
    ["awaiting", "Awaiting decision"], ["awarded", "Awarded"], ["not_selected", "Not selected"], ["skipped", "Skipped"]
  ];
  const CHECKLIST = [
    ["medical", "Medical forms from your clinic or doctor"],
    ["estimate", "Treatment cost estimate"],
    ["essays", "Essays or personal statement"],
    ["financial", "Financial documents"],
    ["references", "References"],
    ["fee", "Application fee ready"]
  ];
  const TRACK_FIELDS = [
    ["submitted_date", "Date submitted", "date"],
    ["confirmation_date", "Confirmation received", "date"],
    ["expected_decision_date", "Expected decision", "date"],
    ["actual_decision_date", "Actual decision", "date"],
    ["award_amount", "Award amount", "text"],
    ["funds_received_date", "Funds received by clinic", "date"]
  ];

  // ---------- Small helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  function todayISO() {
    if (typeof window.FGF_TODAY === "string") return window.FGF_TODAY;
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  const TODAY = todayISO();
  const THIS_MONTH = TODAY.slice(0, 7);

  function lastDayOfMonth(ym) {
    const [y, m] = ym.split("-").map(Number);
    return ym + "-" + pad(new Date(Date.UTC(y, m, 0)).getUTCDate());
  }
  function weekday(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }
  function fmtDate(iso, opts) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const base = MON[m - 1] + " " + d + ", " + y;
    return opts && opts.weekday ? weekday(iso) + ", " + base : base;
  }
  function fmtMonth(ym) {
    const [y, m] = ym.split("-").map(Number);
    return MONTHS[m - 1] + " " + y;
  }
  function fmtTime(t) {
    const [h, mi] = t.split(":").map(Number);
    const ap = h < 12 ? "a.m." : "p.m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + pad(mi) + " " + ap;
  }
  function fmtMoney(n, cur) {
    if (n == null) return null;
    const sym = cur === "GBP" ? "£" : "$";
    return sym + Number(n).toLocaleString("en-US");
  }

  // Timezone conversion for optional Central Time display
  function tzOffset(ts, tz) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ts));
    const g = (t) => Number(parts.find((p) => p.type === t).value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second")) - ts;
  }
  function zonedToUtc(dateStr, timeStr, tz) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    const wall = Date.UTC(y, m - 1, d, hh, mm);
    let guess = wall;
    for (let i = 0; i < 3; i++) guess = wall - tzOffset(guess, tz);
    return guess;
  }
  function inZone(ts, tz) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ts));
    const g = (t) => parts.find((p) => p.type === t).value;
    return { date: g("year") + "-" + g("month") + "-" + g("day"), time: pad(Number(g("hour")) % 24) + ":" + g("minute") };
  }

  // ---------- Storage (this browser only) ----------
  const STORE_KEY = "fgf.v1";
  let store = { favorites: [], tracking: {}, prefs: {} };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      store = { favorites: parsed.favorites || [], tracking: parsed.tracking || {}, prefs: parsed.prefs || {} };
    }
  } catch (e) { /* storage unavailable: the site still works, nothing is saved */ }
  let storageOK = true;
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); storageOK = true; }
    catch (e) { storageOK = false; }
  }
  const isFav = (orgId) => store.favorites.includes(orgId);
  function toggleFav(orgId) {
    store.favorites = isFav(orgId) ? store.favorites.filter((x) => x !== orgId) : store.favorites.concat(orgId);
    save();
  }

  // ---------- Model ----------
  const ORGS = DATA.organizations.map((o) => ({ ...o, pending: false })).concat(CANDIDATES.map((o) => ({ ...o, pending: true })));
  const ORG_BY_ID = Object.fromEntries(ORGS.map((o) => [o.id, o]));
  const CYCLES = [];
  ORGS.forEach((org) => (org.cycles || []).forEach((c) => CYCLES.push({ ...c, org })));
  const CYCLE_BY_ID = Object.fromEntries(CYCLES.map((c) => [c.id, c]));

  function dateConf(d, cycle) {
    if (!d) return "not_announced";
    if (d.confidence) return d.confidence;
    if (d.alternatives && d.alternatives.length) return "needs_confirmation";
    if (d.month && !d.date) return cycle.date_confidence === "historical" ? "historical" : (cycle.date_confidence === "needs_confirmation" ? "needs_confirmation" : "month_only");
    return cycle.date_confidence || "confirmed";
  }
  function allDates(d) {
    if (!d) return [];
    const list = [];
    if (d.date) list.push(d.date);
    (d.alternatives || []).forEach((a) => a.date && list.push(a.date));
    return list;
  }
  function dEarliest(d) {
    if (!d) return null;
    if (d.month && !d.date) return d.month + "-01";
    const l = allDates(d).sort();
    return l[0] || null;
  }
  function dLatest(d) {
    if (!d) return null;
    if (d.month && !d.date) return lastDayOfMonth(d.month);
    const l = allDates(d).sort();
    return l[l.length - 1] || null;
  }

  function cycleStatus(c) {
    if (c.kind === "rolling") return "rolling";
    if (c.kind === "paused") return "paused";
    if (c.kind === "awaiting") return "tba";
    if (c.kind === "event") {
      const e = dLatest(c.event_date);
      if (!e) return "tba";
      return e < TODAY ? "closed" : "upcoming";
    }
    const sub = c.submission_deadline_at;
    const op = c.application_opens_at;
    const closedOrPending = () => {
      const n = dLatest(c.notification_date);
      return n && n >= TODAY ? "pending" : "closed";
    };
    if (sub && dLatest(sub) < TODAY) return closedOrPending();
    if (!sub && (c.closed_verified_on || c.date_confidence === "historical")) return closedOrPending();
    if (op) {
      const early = dEarliest(op);
      const late = dLatest(op);
      if (early > TODAY) return "upcoming";
      if (late >= TODAY && early !== late && !c.open_verified_on) return "upcoming"; // opening month or conflicting days include today
      if (c.open_verified_on) return "open";
      // The opening has passed. With a future deadline, or a confirmed exact opening date, the cycle is open.
      if (sub || (op.date && !op.alternatives && dateConf(op, c) === "confirmed")) return "open";
      // An opening month (or uncertain date) has passed and no deadline is listed yet
      return "check";
    }
    if (c.open_verified_on) return "open";
    if (sub) return "upcoming";
    return "tba";
  }
  const GROUP_OF = { open: "open", upcoming: "upcoming", rolling: "rolling", tba: "tba", check: "tba", paused: "tba", pending: "archive", closed: "archive" };

  function cycleEvents(c) {
    const evs = [];
    EVENT_TYPES.forEach((t) => {
      const d = c[t.key];
      if (!d) return;
      evs.push({ type: t, d, cycle: c, conf: dateConf(d, c), sortDate: dEarliest(d), precision: d.date ? "day" : "month" });
    });
    return evs;
  }

  function nextDeadlineKey(c) {
    const s = c.submission_deadline_at;
    if (s) {
      const e = dEarliest(s);
      if (dLatest(s) >= TODAY) {
        const conf = dateConf(s, c);
        return [conf === "confirmed" ? 0 : 1, e];
      }
    }
    const op = c.application_opens_at;
    if (op && dLatest(op) >= TODAY) return [2, dEarliest(op)];
    if (c.kind === "event" && c.event_date && dLatest(c.event_date) >= TODAY) return [2, dEarliest(c.event_date)];
    if (c.kind === "rolling") return [3, "9999"];
    return [4, "9999"];
  }

  function feeKind(org) {
    if (org.application_fee === 0) return "none";
    if (org.application_fee == null) return "unknown";
    return "has";
  }
  function clinicKind(org) {
    if (org.clinic_required === true) return "yes";
    if (org.clinic_required === false) return "no";
    return "unknown";
  }

  function haystack(c) {
    const o = c.org;
    const parts = [o.name, o.program_name, o.program_type, c.cycle_label, c.cycle_year, o.geography && o.geography.text,
      (o.geography && o.geography.states || []).map((s) => s + " " + (STATE_NAMES[s] || "")).join(" "),
      (o.treatments_covered || []).join(" "), (o.eligibility_notes || []).join(" "), (o.coverage_notes || []).join(" "),
      o.award_text, o.fee_text, o.clinic_restrictions, c.status_note, c.recurring_text, c.notification_window_text, c.funds_available_text,
      STATUS_LABEL[cycleStatus(c)]];
    cycleEvents(c).forEach((e) => {
      const iso = e.d.date || (e.d.month + "-01");
      parts.push(MONTHS[Number(iso.slice(5, 7)) - 1], iso.slice(0, 4));
    });
    (c.recurring_months || []).forEach((m) => parts.push(MONTHS[m - 1]));
    if (o.pending) parts.push("pending review");
    return parts.filter(Boolean).join(" ").toLowerCase();
  }
  CYCLES.forEach((c) => { c._hay = haystack(c); });

  // ---------- Filters ----------
  const F = {
    q: $("#q"), year: $("#f-year"), month: $("#f-month"), conf: $("#f-conf"), geo: $("#f-geo"), state: $("#f-state"),
    clinic: $("#f-clinic"), treat: $("#f-treat"), fee: $("#f-fee"), fav: $("#f-fav"), sort: $("#sort")
  };
  const STATUS_BOXES = $$(".filters fieldset input[type=checkbox]");

  function fillSelects() {
    const years = new Set();
    CYCLES.forEach((c) => { if (c.cycle_year) years.add(c.cycle_year); });
    const ys = Array.from(years).sort();
    F.year.innerHTML = '<option value="">Any year</option>' + ys.map((y) => `<option value="${y}">${y}</option>`).join("") + '<option value="none">Year not announced</option>';
    F.month.innerHTML = '<option value="">Any month</option>' + MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("");
    const states = new Set();
    ORGS.forEach((o) => (o.geography && o.geography.states || []).forEach((s) => states.add(s)));
    F.state.innerHTML = '<option value="">Any state</option>' + Array.from(states).sort((a, b) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b)).map((s) => `<option value="${s}">${esc(STATE_NAMES[s] || s)}</option>`).join("");
    const treats = new Set();
    ORGS.forEach((o) => (o.treatments_covered || []).forEach((t) => treats.add(t)));
    F.treat.innerHTML = '<option value="">Any treatment</option>' + Array.from(treats).sort().map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  function cycleMonths(c) {
    const set = new Set();
    cycleEvents(c).forEach((e) => {
      if (e.d.date) allDates(e.d).forEach((x) => set.add(x.slice(0, 7)));
      else if (e.d.month) set.add(e.d.month);
    });
    return set;
  }

  function matches(c, opts) {
    const o = c.org;
    const st = GROUP_OF[cycleStatus(c)];
    if (!opts.ignoreStatus && !opts.statuses.has(st)) return false;
    if (opts.q) {
      const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((t) => c._hay.includes(t))) return false;
    }
    if (opts.year) {
      if (opts.year === "none") { if (c.cycle_year) return false; }
      else if (String(c.cycle_year) !== opts.year) {
        const months = cycleMonths(c);
        if (!Array.from(months).some((m) => m.startsWith(opts.year))) return false;
      }
    }
    if (opts.month) {
      const m = Number(opts.month);
      const months = cycleMonths(c);
      const hit = Array.from(months).some((ym) => Number(ym.slice(5, 7)) === m && (!opts.year || opts.year === "none" || ym.startsWith(opts.year)));
      const recurringHit = (c.recurring_months || []).includes(m);
      if (!hit && !recurringHit) return false;
    }
    if (opts.conf) {
      const confs = cycleEvents(c).map((e) => e.conf);
      if (opts.conf === "confirmed" && !confs.includes("confirmed")) return false;
      if (opts.conf === "needs_confirmation" && !(confs.includes("needs_confirmation") || c.date_confidence === "needs_confirmation")) return false;
      if (opts.conf === "awaiting" && !(c.kind === "awaiting" || c.kind === "paused" || cycleStatus(c) === "check")) return false;
    }
    if (opts.geo && (o.geography && o.geography.type || "unknown") !== opts.geo) return false;
    if (opts.state && !(o.geography && (o.geography.states || []).includes(opts.state))) return false;
    if (opts.clinic && clinicKind(o) !== opts.clinic) return false;
    if (opts.treat && !(o.treatments_covered || []).includes(opts.treat)) return false;
    if (opts.fee && feeKind(o) !== opts.fee) return false;
    if (opts.fav && !isFav(o.id)) return false;
    return true;
  }

  function currentOpts() {
    return {
      q: F.q.value.trim(),
      statuses: new Set(STATUS_BOXES.filter((b) => b.checked).map((b) => b.value)),
      year: F.year.value, month: F.month.value, conf: F.conf.value, geo: F.geo.value, state: F.state.value,
      clinic: F.clinic.value, treat: F.treat.value, fee: F.fee.value, fav: F.fav.checked
    };
  }

  function sortCycles(list, how) {
    const byName = (a, b) => a.org.name.localeCompare(b.org.name) || String(a.cycle_label).localeCompare(String(b.cycle_label));
    if (how === "name") return list.sort(byName);
    if (how === "award") return list.sort((a, b) => (b.org.currency === "USD" ? b.org.award_max || -1 : -1) - (a.org.currency === "USD" ? a.org.award_max || -1 : -1) || byName(a, b));
    return list.sort((a, b) => {
      const ka = nextDeadlineKey(a), kb = nextDeadlineKey(b);
      return ka[0] - kb[0] || ka[1].localeCompare(kb[1]) || byName(a, b);
    });
  }

  // ---------- Rendering pieces ----------
  function chip(conf) {
    return `<span class="chip c-${conf}" title="${esc(CONF_HELP[conf] || "")}">${esc(CONF_LABEL[conf] || conf)}</span>`;
  }
  function pill(status) {
    return `<span class="pill s-${status}">${esc(STATUS_LABEL[status])}</span>`;
  }

  function timeText(d, showCentral) {
    if (!d.time) return "";
    let s = fmtTime(d.time) + (d.tz_label ? " " + d.tz_label : "");
    if (showCentral && d.tz && d.date && d.tz !== DATA.meta.display_timezone) {
      const ts = zonedToUtc(d.date, d.time, d.tz);
      const z = inZone(ts, DATA.meta.display_timezone);
      const day = z.date !== d.date ? fmtDate(z.date) + ", " : "";
      s += ` <span class="tz2">(${day}${fmtTime(z.time)} CT)</span>`;
    }
    return s;
  }

  function dateValueHTML(d, c, opts) {
    opts = opts || {};
    if (!d) return `<span class="dv na">${opts.naText || "Not announced"}</span>`;
    const conf = dateConf(d, c);
    const showCentral = !!store.prefs.central;
    let main;
    if (d.date) {
      main = fmtDate(d.date, { weekday: opts.weekday });
      const t = timeText(d, showCentral);
      if (t) main += ", " + t;
    } else if (d.month) {
      main = fmtMonth(d.month) + (d.time ? ", " + timeText(d, false) : "") + " <span class=\"muted\">(day not announced)</span>";
    } else {
      main = "Not announced";
    }
    if (d.alternatives && d.alternatives.length) {
      main += " <span class=\"muted\">or</span> " + d.alternatives.map((a) => fmtDate(a.date) + (a.time ? ", " + fmtTime(a.time) + (a.tz_label ? " " + a.tz_label : "") : "")).join(" or ");
    }
    let html = `<span class="dv">${main}</span>${chip(conf)}`;
    if (opts.basis) html += `<span class="muted">${esc(opts.basis)}</span>`;
    if (opts.showNotes && d.note) html += `<span class="sub">${esc(d.note)}</span>`;
    if (opts.showNotes && d.alternatives) html += `<ul class="alts sub">${d.alternatives.map((a) => `<li>${esc(fmtDate(a.date))}: ${esc(a.source || "")}</li>`).join("")}</ul>`;
    return html;
  }

  function basisText(c) {
    if (!c.deadline_basis) return null;
    if (c.deadline_basis === "postmark") return "Postmark deadline";
    if (c.deadline_basis === "receipt") return "Must be received";
    if (c.deadline_basis === "submitted") return "Submit online";
    return "Deadline type not stated";
  }

  function ledgerHTML(c, full) {
    const rows = [];
    const st = cycleStatus(c);
    if (c.kind === "rolling") {
      rows.push(["Applications", `<span class="dv">Accepted year-round</span>${chip("confirmed")}`]);
      if (c.notification_window_text) rows.push(["Decisions", `<span class="dv na">${esc(c.notification_window_text)}</span>`]);
      return rows;
    }
    if (c.kind === "awaiting" || c.kind === "paused") {
      rows.push(["Next dates", `<span class="dv na">Not announced</span>${chip(c.date_confidence === "recurring" ? "recurring" : (c.kind === "paused" ? "needs_confirmation" : "not_announced"))}`]);
      if (c.recurring_text) rows.push(["Past pattern", `<span>${esc(c.recurring_text)}</span>`]);
      return rows;
    }
    if (c.kind === "event") {
      rows.push(["Event", dateValueHTML(c.event_date, c, { weekday: true, showNotes: full })]);
      if (c.notification_window_text) rows.push(["Selection", `<span>${esc(c.notification_window_text)}</span>`]);
      return rows;
    }
    rows.push(["Opens", dateValueHTML(c.application_opens_at, c, { showNotes: full, naText: c.open_verified_on ? "Open now (opening date not listed)" : "Not announced" })]);
    if (c.start_application_deadline_at || full) rows.push(["Start by", dateValueHTML(c.start_application_deadline_at, c, { showNotes: full })]);
    rows.push(["Submit by", dateValueHTML(c.submission_deadline_at, c, { weekday: true, showNotes: full, basis: c.submission_deadline_at ? basisText(c) : null })]);
    if (c.notification_date) rows.push(["Decisions", dateValueHTML(c.notification_date, c, { showNotes: full }) + (full && c.notification_window_text ? `<span class="sub">${esc(c.notification_window_text)}</span>` : "")]);
    else rows.push(["Decisions", c.notification_window_text ? `<span>${esc(c.notification_window_text)}</span>` : `<span class="dv na">Not announced</span>`]);
    if (c.funds_available_date) rows.push(["Funds", dateValueHTML(c.funds_available_date, c, { showNotes: full })]);
    else if (c.funds_available_text || full) rows.push(["Funds", c.funds_available_text ? `<span>${esc(c.funds_available_text)}</span>` : `<span class="dv na">Not announced</span>`]);
    if (full || st !== "closed") {
      if (c.treatment_start_rule || full) rows.push(["Start treatment", c.treatment_start_rule ? `<span>${esc(c.treatment_start_rule)}</span>` : `<span class="dv na">Not yet verified</span>`]);
      if (c.expiration_rule || full) rows.push(["Use funds by", c.expiration_rule ? `<span>${esc(c.expiration_rule)}</span>` : `<span class="dv na">Not yet verified</span>`]);
    }
    return rows;
  }
  function ledger(c, full) {
    return `<dl class="ledger">${ledgerHTML(c, full).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  }

  function awardText(o) {
    if (o.award_min != null && o.award_max != null && o.award_min !== o.award_max) return fmtMoney(o.award_min, o.currency) + " to " + fmtMoney(o.award_max, o.currency);
    if (o.award_max != null) return (o.award_min === o.award_max ? "" : "Up to ") + fmtMoney(o.award_max, o.currency);
    return "Not announced";
  }
  function feeText(o) {
    if (o.application_fee === 0) return "No fee";
    if (o.application_fee == null) return "Not announced";
    return fmtMoney(o.application_fee, o.fee_currency || o.currency);
  }
  function geoShort(o) {
    const g = o.geography || {};
    if (g.type === "us_national") return "U.S. nationwide";
    if (g.type === "international") return g.country === "UK" ? "United Kingdom only" : "Outside the U.S.";
    if (g.type === "us_regional") return (g.states || []).map((s) => STATE_NAMES[s] || s).join(", ") || "Certain areas";
    return "Not stated";
  }
  function clinicShort(o) {
    const k = clinicKind(o);
    return k === "yes" ? "Partner clinic required" : k === "no" ? "Any eligible clinic" : "Not stated";
  }
  function verifiedText(o) {
    return o.last_verified_at ? "Checked " + fmtDate(o.last_verified_at) : "Not yet verified";
  }

  function trackLabel(cycleId) {
    const t = store.tracking[cycleId];
    if (!t || !t.status) return "";
    const s = TRACK_STATUSES.find((x) => x[0] === t.status);
    return s ? s[1] : "";
  }

  function card(c) {
    const o = c.org;
    const st = cycleStatus(c);
    const tl = trackLabel(c.id);
    const note = c.status_note ? `<p class="note">${esc(c.status_note)}</p>` : "";
    const statusExtra = st === "pending" && c.notification_date ? `<p class="note">Decisions expected by ${esc(fmtDate(dLatest(c.notification_date)))}.</p>` : (st === "check" ? `<p class="note">The announced opening has passed and no deadline is listed yet. Check the official source.</p>` : "");
    const review = o.pending ? `<p class="note-box"><strong>Pending your review.</strong> ${esc(o.review && o.review.why || "")} Not shown on the public site.</p>` : "";
    return `<article class="card${o.pending ? " is-pending" : ""}" data-cycle="${esc(c.id)}">
      <div class="card-top">${pill(st)}${o.pending ? '<span class="pill review">Pending review</span>' : ""}<span class="cycle-tag">${esc(c.cycle_label)}</span></div>
      <div class="card-title">
        <h4><button type="button" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">${esc(o.name)}</button></h4>
        <p class="card-sub">${esc(o.program_name)}</p>
      </div>
      ${review}
      ${ledger(c, false)}
      ${statusExtra}${note}
      <div class="facts">
        <div><span>Award</span><span>${esc(awardText(o))}</span></div>
        <div><span>Application fee</span><span>${esc(feeText(o))}</span></div>
        <div><span>Where</span><span>${esc(geoShort(o))}</span></div>
        <div><span>Clinic</span><span>${esc(clinicShort(o))}</span></div>
      </div>
      <div class="card-foot">
        <div class="src">
          <a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Official source</a>
          <span class="muted">${esc(verifiedText(o))}</span>
        </div>
        <div class="card-actions">
          ${tl ? `<span class="track-state">${esc(tl)}</span>` : ""}
          <button type="button" class="btn fav-btn" data-fav="${esc(o.id)}" aria-pressed="${isFav(o.id)}">${isFav(o.id) ? "★ Saved" : "☆ Save"}</button>
          <button type="button" class="btn" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">Details</button>
        </div>
      </div>
    </article>`;
  }

  function tableHTML(list) {
    const row = (c) => {
      const o = c.org;
      const st = cycleStatus(c);
      const cell = (d) => {
        if (!d) return '<span class="muted">Not announced</span>';
        return dateValueHTML(d, c, {}).replace(/<span class="tz2">.*?<\/span>/, "");
      };
      return `<tr>
        <td class="t-org"><button type="button" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">${esc(o.name)}</button><div class="muted">${esc(o.program_name)}</div>${o.pending ? '<span class="pill review">Pending review</span>' : ""}</td>
        <td>${esc(c.cycle_label)}</td>
        <td>${pill(st)}</td>
        <td>${c.kind === "rolling" ? "Year-round" : cell(c.application_opens_at)}</td>
        <td>${c.kind === "event" ? cell(c.event_date) : (c.kind === "rolling" ? "None" : cell(c.submission_deadline_at))}</td>
        <td>${c.notification_date ? cell(c.notification_date) : esc(c.notification_window_text || "Not announced")}</td>
        <td>${esc(awardText(o))}</td>
        <td>${esc(feeText(o))}</td>
        <td>${esc(geoShort(o))}</td>
        <td><a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source</a><div class="muted">${esc(verifiedText(o))}</div></td>
      </tr>`;
    };
    return `<div class="table-wrap"><table>
      <thead><tr><th>Organization</th><th>Cycle</th><th>Status</th><th>Opens</th><th>Deadline or event</th><th>Decisions</th><th>Award</th><th>Fee</th><th>Where</th><th>Source</th></tr></thead>
      <tbody>${list.map(row).join("")}</tbody></table></div>`;
  }

  const GROUPS = [
    { key: "open", title: "Open now", help: "Accepting applications today, based on dates or notices from the organization." },
    { key: "upcoming", title: "Upcoming", help: "Announced cycles that haven't opened yet, or that have a future deadline or event." },
    { key: "rolling", title: "Rolling, year-round", help: "Applications accepted at any time, usually depending on available funding." },
    { key: "tba", title: "Dates to be announced", help: "Programs waiting to announce their next cycle. Past patterns are shown for reference only." },
    { key: "archive", title: "Archive: past cycles", help: "Closed cycles, kept with their original dates." }
  ];

  let layout = store.prefs.layout === "table" ? "table" : "cards";

  function renderFind() {
    const opts = currentOpts();
    const list = sortCycles(CYCLES.filter((c) => matches(c, opts)), F.sort.value);
    const orgCount = new Set(list.map((c) => c.org.id)).size;
    $("#result-count").innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? "cycle" : "cycles"} from <strong>${orgCount}</strong> ${orgCount === 1 ? "organization" : "organizations"}`;
    const moreActive = [F.conf, F.geo, F.state, F.clinic, F.treat, F.fee].filter((s) => s.value).length;
    $("#more-count").textContent = moreActive ? `(${moreActive} on)` : "";
    const out = $("#results");
    if (!list.length) {
      out.innerHTML = `<p class="empty">No grants match these filters. Try removing a filter, or turn on "Past cycles (archive)".</p>`;
      return;
    }
    if (layout === "table") { out.innerHTML = tableHTML(list); return; }
    out.innerHTML = GROUPS.map((g) => {
      const items = list.filter((c) => GROUP_OF[cycleStatus(c)] === g.key);
      if (!items.length) return "";
      return `<section class="group" aria-label="${esc(g.title)}">
        <div class="group-head"><h3>${esc(g.title)}</h3><p>${esc(g.help)}</p></div>
        <div class="cards">${items.map(card).join("")}</div>
      </section>`;
    }).join("");
  }

  // ---------- Detail dialog ----------
  const detail = $("#detail");
  function openDetail(orgId, focusCycleId) {
    const o = ORG_BY_ID[orgId];
    if (!o) return;
    const cycles = CYCLES.filter((c) => c.org.id === orgId);
    const current = cycles.filter((c) => GROUP_OF[cycleStatus(c)] !== "archive");
    const past = cycles.filter((c) => GROUP_OF[cycleStatus(c)] === "archive");
    const list = (arr) => arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted">Not yet verified.</p>`;
    const cycleBlock = (c, archived) => `
      <div class="cycle-block${archived ? " archived" : ""}" id="cb-${esc(c.id)}">
        <h4>${esc(c.cycle_label)} ${pill(cycleStatus(c))}</h4>
        ${ledger(c, true)}
        ${c.status_note ? `<p class="note">${esc(c.status_note)}</p>` : ""}
        <p class="note"><a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source for this cycle</a></p>
        ${trackerForm(c)}
      </div>`;
    $("#detail-body").innerHTML = `
      <div class="dialog-head">
        <div>
          ${o.pending ? '<span class="pill review">Pending your review: not on the public site</span>' : ""}
          <h2 id="detail-title">${esc(o.name)}</h2>
          <p class="card-sub">${esc(o.program_name)} · ${esc(o.program_type)}</p>
        </div>
        <button type="button" class="icon-btn" data-close aria-label="Close">×</button>
      </div>
      <div class="detail-meta">
        <span>${esc(verifiedText(o))}</span>
        <span>Verification: ${esc({ verified: "Checked against official pages", partially_verified: "Partly verified", unverified: "Needs verification" }[o.verification_status] || o.verification_status)}</span>
        <span>Research compiled ${esc(fmtDate(DATA.meta.research_compiled))}</span>
      </div>
      <div class="dlg-actions">
        ${o.application_url ? `<a class="btn btn-primary" href="${esc(o.application_url)}" target="_blank" rel="noopener">Official application page</a>` : ""}
        <a class="btn" href="${esc(o.official_url)}" target="_blank" rel="noopener">Official website</a>
        <button type="button" class="btn fav-btn" data-fav="${esc(o.id)}" aria-pressed="${isFav(o.id)}">${isFav(o.id) ? "★ Saved" : "☆ Save"}</button>
      </div>
      <div class="facts">
        <div><span>Award</span><span>${esc(o.award_text || awardText(o))}</span></div>
        <div><span>Application fee</span><span>${esc(o.fee_text || feeText(o))}</span></div>
        <div><span>Where</span><span>${esc(o.geography && o.geography.text || "Not stated")}</span></div>
        <div><span>Clinic</span><span>${esc(o.clinic_restrictions || clinicShort(o))}</span></div>
        <div><span>Treatments mentioned</span><span>${esc((o.treatments_covered || []).join(", ") || "Not yet verified")}</span></div>
      </div>
      <section class="detail-section"><h3>Review eligibility</h3>
        <p class="note">Published requirements, summarized. Only the organization can decide whether you qualify.</p>
        ${list(o.eligibility_notes)}
      </section>
      <section class="detail-section"><h3>What's covered and not covered</h3>${list(o.coverage_notes)}</section>
      <section class="detail-section"><h3>Current and upcoming cycles</h3>
        ${current.length ? current.map((c) => cycleBlock(c, false)).join("") : '<p class="muted">No current or upcoming cycle has been announced.</p>'}
      </section>
      ${past.length ? `<section class="detail-section"><h3>Archive: past cycles</h3>${past.map((c) => cycleBlock(c, true)).join("")}</section>` : ""}
      ${(o.research_notes || []).length ? `<section class="detail-section"><h3>Research notes</h3>${list(o.research_notes)}</section>` : ""}
      <section class="detail-section"><h3>Sources</h3><ul>${(o.source_urls || []).map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join("")}</ul></section>
    `;
    if (!detail.open) detail.showModal();
    const target = focusCycleId && document.getElementById("cb-" + focusCycleId);
    if (target && focusCycleId !== cycles[0].id) target.scrollIntoView({ block: "start" });
    else $(".dialog-inner", detail).scrollTop = 0;
    if (location.hash !== "#grant-" + orgId) history.replaceState(null, "", "#grant-" + orgId);
  }

  function trackerForm(c) {
    const t = store.tracking[c.id] || {};
    const id = (k) => `t-${c.id}-${k}`;
    return `<details class="tracker-form" ${t.status ? "open" : ""}>
      <summary class="btn-link">Track my application for ${esc(c.cycle_label)}</summary>
      <form data-track="${esc(c.id)}">
        <div class="tf-grid">
          <div class="field"><label for="${id("status")}">My status</label>
            <select id="${id("status")}" name="status"><option value="">Not tracking</option>${TRACK_STATUSES.map(([v, l]) => `<option value="${v}" ${t.status === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          ${TRACK_FIELDS.map(([k, l, type]) => `<div class="field"><label for="${id(k)}">${l}</label><input id="${id(k)}" name="${k}" type="${type}" value="${esc(t[k] || "")}"></div>`).join("")}
        </div>
        <div class="field"><label for="${id("notes")}">Notes (non-sensitive only)</label><textarea id="${id("notes")}" name="notes" rows="3" placeholder="For example: emailed to ask about the fee waiver.">${esc(t.notes || "")}</textarea></div>
        <fieldset class="field checklist"><legend>Optional preparation checklist</legend>
          <p class="note">A general list. Requirements vary by grant, so check the official application before relying on it.</p>
          ${CHECKLIST.map(([k, l]) => `<label class="check"><input type="checkbox" id="${id("ck-" + k)}" name="ck-${k}" ${t.checklist && t.checklist[k] ? "checked" : ""}> ${l}</label>`).join("")}
        </fieldset>
        <p class="saved-msg" aria-live="polite"></p>
      </form>
    </details>`;
  }

  function saveTrackForm(form) {
    const cid = form.getAttribute("data-track");
    const fd = new FormData(form);
    const rec = { checklist: {} };
    rec.status = fd.get("status") || "";
    TRACK_FIELDS.forEach(([k]) => { rec[k] = (fd.get(k) || "").toString(); });
    rec.notes = (fd.get("notes") || "").toString();
    CHECKLIST.forEach(([k]) => { rec.checklist[k] = !!fd.get("ck-" + k); });
    const empty = !rec.status && TRACK_FIELDS.every(([k]) => !rec[k]) && !rec.notes && !Object.values(rec.checklist).some(Boolean);
    if (empty) delete store.tracking[cid];
    else { rec.updated = TODAY; store.tracking[cid] = rec; }
    save();
    const msg = $(".saved-msg", form);
    if (msg) msg.textContent = storageOK ? "Saved in this browser." : "Couldn't save. This browser is blocking storage (for example, a private window).";
    updateTrackerCount();
  }

  // ---------- Calendar & timeline ----------
  let calMonth = THIS_MONTH;
  const evTypeOn = new Set(store.prefs.evTypes || EVENT_TYPES.map((t) => t.key));

  function calendarEvents() {
    const favOnly = $("#cal-fav").checked;
    const withUnconf = $("#cal-unconfirmed").checked;
    const out = [];
    CYCLES.forEach((c) => {
      if (favOnly && !isFav(c.org.id)) return;
      cycleEvents(c).forEach((e) => {
        if (!evTypeOn.has(e.type.key)) return;
        if (!withUnconf && e.conf !== "confirmed") return;
        if (e.conf === "recurring") return;
        out.push(e);
      });
    });
    return out;
  }

  function evButton(e, day) {
    const c = e.cycle;
    const unconf = e.conf !== "confirmed";
    const label = `${e.type.short}: ${c.org.name}`;
    const title = `${e.type.label}: ${c.org.name}, ${c.cycle_label}. ${CONF_LABEL[e.conf]}.`;
    return `<button type="button" class="ev${unconf ? " unconf" : ""}" style="--evc:${e.type.color}" data-open="${esc(c.org.id)}" data-cycle-focus="${esc(c.id)}" title="${esc(title)}">${esc(label)}${unconf ? " *" : ""}</button>`;
  }

  function renderCalendar() {
    const evs = calendarEvents();
    const [y, m] = calMonth.split("-").map(Number);
    $("#cal-label").textContent = fmtMonth(calMonth);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const startDow = first.getUTCDay();
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const byDay = {};
    evs.forEach((e) => {
      if (e.precision !== "day") return;
      allDates(e.d).forEach((iso) => { (byDay[iso] = byDay[iso] || []).push(e); });
    });
    let cells = DOW.map((d) => `<div class="cal-dow" role="columnheader">${d}</div>`).join("");
    const totalCells = Math.ceil((startDow + daysIn) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startDow + 1;
      const inMonth = dayNum >= 1 && dayNum <= daysIn;
      const dt = new Date(Date.UTC(y, m - 1, dayNum));
      const iso = dt.getUTCFullYear() + "-" + pad(dt.getUTCMonth() + 1) + "-" + pad(dt.getUTCDate());
      const list = byDay[iso] || [];
      cells += `<div class="cal-day${inMonth ? "" : " other"}${iso === TODAY ? " today" : ""}" role="gridcell" aria-label="${esc(fmtDate(iso, { weekday: true }))}${list.length ? ", " + list.length + " dates" : ""}">
        <span class="cal-num">${dt.getUTCDate()}</span>${list.map((e) => evButton(e)).join("")}</div>`;
    }
    $("#cal-grid").innerHTML = cells;

    const monthDays = Object.keys(byDay).filter((d) => d.startsWith(calMonth)).sort();
    $("#cal-agenda").innerHTML = monthDays.length
      ? monthDays.map((d) => `<div class="monthonly"><h4>${esc(fmtDate(d, { weekday: true }))}</h4>${byDay[d].map((e) => evButton(e)).join("")}</div>`).join("")
      : `<p class="empty">No published dates in ${esc(fmtMonth(calMonth))} for the selected types.</p>`;

    const monthOnly = evs.filter((e) => e.precision === "month" && e.d.month === calMonth);
    $("#cal-monthonly").innerHTML = monthOnly.length
      ? `<div class="monthonly"><h4>Also in ${esc(fmtMonth(calMonth))} (day not announced)</h4>${monthOnly.map((e) => evButton(e)).join("")}</div>`
      : "";
    renderTimeline(evs);
  }

  function renderTimeline(evs) {
    const showPast = $("#tl-past").checked;
    const items = [];
    evs.forEach((e) => {
      const key = e.sortDate;
      const end = dLatest(e.d);
      if (!showPast && end < TODAY) return;
      items.push({ e, key });
    });
    items.sort((a, b) => a.key.localeCompare(b.key) || a.e.cycle.org.name.localeCompare(b.e.cycle.org.name));
    const byMonth = {};
    items.forEach((it) => { const k = it.key.slice(0, 7); (byMonth[k] = byMonth[k] || []).push(it); });
    const months = Object.keys(byMonth).sort();
    $("#timeline").innerHTML = months.length ? months.map((mk) => `<li class="tl-month"><h4>${esc(fmtMonth(mk))}</h4><ol class="tl-items">${byMonth[mk].map(({ e }) => {
      const c = e.cycle;
      return `<li class="tl-item" style="--evc:${e.type.color}">
        <span class="tl-date">${e.precision === "day" ? esc(fmtDate(e.d.date)) : "Day not announced"}</span>
        <span class="tl-body"><span>${esc(e.type.label)} · <button type="button" data-open="${esc(c.org.id)}" data-cycle-focus="${esc(c.id)}">${esc(c.org.name)}</button> · ${esc(c.cycle_label)}${c.org.pending ? " · Pending review" : ""}</span>
        <span>${dateValueHTML(e.d, c, {})}</span></span>
      </li>`;
    }).join("")}</ol></li>`).join("") : `<li class="empty">No dates to show. Try including dates that need confirmation, or show past dates.</li>`;
  }

  function renderTypes() {
    $("#event-types").innerHTML = "<legend>Show</legend>" + EVENT_TYPES.map((t) => `<label class="check"><input type="checkbox" id="ev-${t.key}" value="${t.key}" ${evTypeOn.has(t.key) ? "checked" : ""}><span class="swatch" style="background:${t.color}"></span>${esc(t.label)}</label>`).join("");
  }

  // ---------- Tracker view ----------
  function updateTrackerCount() {
    const n = Object.keys(store.tracking).length + store.favorites.length;
    const el = $("#tracker-count");
    el.hidden = n === 0;
    el.textContent = n;
  }

  function renderTracker() {
    const tracked = Object.entries(store.tracking).map(([cid, t]) => ({ cid, t, c: CYCLE_BY_ID[cid] }));
    const favOrgs = store.favorites.map((id) => ORG_BY_ID[id]).filter(Boolean);
    let html = "";
    if (!storageOK) html += `<p class="note-box">This browser is blocking storage, so changes won't be kept after you close the page.</p>`;
    if (!tracked.length && !favOrgs.length) {
      html += `<div class="empty"><p><strong>Nothing saved yet.</strong> Use <strong>☆ Save</strong> on any grant to keep it here. Open a grant's <strong>Details</strong> to track an application: your status, dates, award, and an optional preparation checklist.</p></div>`;
      $("#tracker-body").innerHTML = html;
      return;
    }
    const counts = {};
    tracked.forEach(({ t }) => { counts[t.status || "none"] = (counts[t.status || "none"] || 0) + 1; });
    html += `<div class="tracker-summary">${TRACK_STATUSES.filter(([v]) => counts[v]).map(([v, l]) => `<span class="chip">${esc(l)}: ${counts[v]}</span>`).join("")}</div>`;
    if (tracked.length) {
      html += `<h3>Applications</h3><div class="table-wrap"><table><thead><tr><th>Grant</th><th>Cycle</th><th>My status</th><th>Deadline</th><th>Submitted</th><th>Expected decision</th><th>Decision</th><th>Award</th><th>Notes</th></tr></thead><tbody>` +
        tracked.sort((a, b) => (a.c ? a.c.org.name : a.cid).localeCompare(b.c ? b.c.org.name : b.cid)).map(({ cid, t, c }) => {
          if (!c) return `<tr><td colspan="9">A tracked cycle (${esc(cid)}) is no longer listed. Your notes: ${esc(t.notes || "none")}</td></tr>`;
          const s = TRACK_STATUSES.find((x) => x[0] === t.status);
          return `<tr>
            <td class="t-org"><button type="button" data-open="${esc(c.org.id)}" data-cycle-focus="${esc(c.id)}">${esc(c.org.name)}</button></td>
            <td>${esc(c.cycle_label)}</td><td>${esc(s ? s[1] : "Not set")}</td>
            <td>${c.submission_deadline_at ? dateValueHTML(c.submission_deadline_at, c, {}) : '<span class="muted">Not announced</span>'}</td>
            <td>${esc(t.submitted_date ? fmtDate(t.submitted_date) : "")}</td>
            <td>${esc(t.expected_decision_date ? fmtDate(t.expected_decision_date) : "")}</td>
            <td>${esc(t.actual_decision_date ? fmtDate(t.actual_decision_date) : "")}</td>
            <td>${esc(t.award_amount || "")}</td>
            <td>${esc(t.notes || "")}</td></tr>`;
        }).join("") + `</tbody></table></div>`;
    }
    if (favOrgs.length) {
      html += `<h3 style="margin-top:24px">Saved grants</h3><div class="cards">` + favOrgs.map((o) => {
        const cs = sortCycles(CYCLES.filter((c) => c.org.id === o.id && GROUP_OF[cycleStatus(c)] !== "archive"), "deadline");
        return cs.length ? card(cs[0]) : card(CYCLES.filter((c) => c.org.id === o.id).slice(-1)[0]);
      }).join("") + `</div>`;
    }
    html += `<div class="tracker-actions">
      <button type="button" class="btn" id="export-tracker">Download my tracker (CSV)</button>
      <button type="button" class="btn" id="clear-all">Clear everything saved in this browser</button>
      <span id="clear-confirm"></span></div>`;
    $("#tracker-body").innerHTML = html;
  }

  // ---------- Exports ----------
  function csvCell(v) {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function dateCSV(d) {
    if (!d) return "";
    let s = d.date || d.month || "";
    if (d.time) s += " " + d.time + (d.tz_label ? " " + d.tz_label : "");
    if (d.alternatives) s += " | or " + d.alternatives.map((a) => a.date).join(" | or ");
    return s;
  }
  function grantsCSV(list) {
    const head = ["organization", "program", "cycle", "cycle_year", "status", "application_opens", "start_application_by", "submission_deadline", "deadline_basis", "event_date", "notification", "notification_window", "funds_available", "treatment_start_rule", "expiration_rule", "date_confidence", "award", "application_fee", "geography", "clinic_rule", "treatments", "official_source", "last_checked"];
    const rows = list.map((c) => {
      const o = c.org;
      return [o.name, o.program_name, c.cycle_label, c.cycle_year, STATUS_LABEL[cycleStatus(c)], dateCSV(c.application_opens_at), dateCSV(c.start_application_deadline_at), dateCSV(c.submission_deadline_at), c.deadline_basis, dateCSV(c.event_date),
        dateCSV(c.notification_date), c.notification_window_text, dateCSV(c.funds_available_date) || c.funds_available_text, c.treatment_start_rule, c.expiration_rule, CONF_LABEL[c.date_confidence] || c.date_confidence,
        o.award_text || awardText(o), o.fee_text || feeText(o), o.geography && o.geography.text, o.clinic_restrictions || clinicShort(o), (o.treatments_covered || []).join("; "), c.source_url || o.official_url, o.last_verified_at || "not verified"];
    });
    return [head].concat(rows).map((r) => r.map(csvCell).join(",")).join("\r\n");
  }
  function trackerCSV() {
    const head = ["organization", "cycle", "my_status", "submitted_date", "confirmation_date", "expected_decision_date", "actual_decision_date", "award_amount", "funds_received_date", "notes", "checklist_done", "last_updated"];
    const rows = Object.entries(store.tracking).map(([cid, t]) => {
      const c = CYCLE_BY_ID[cid];
      const s = TRACK_STATUSES.find((x) => x[0] === t.status);
      return [c ? c.org.name : cid, c ? c.cycle_label : "", s ? s[1] : "", t.submitted_date, t.confirmation_date, t.expected_decision_date, t.actual_decision_date, t.award_amount, t.funds_received_date, t.notes,
        CHECKLIST.filter(([k]) => t.checklist && t.checklist[k]).map(([, l]) => l).join("; "), t.updated];
    });
    store.favorites.forEach((id) => { if (ORG_BY_ID[id]) rows.push([ORG_BY_ID[id].name, "(saved grant)", "", "", "", "", "", "", "", "", "", ""]); });
    return [head].concat(rows).map((r) => r.map(csvCell).join(",")).join("\r\n");
  }
  function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function foldLine(line) {
    const out = [];
    while (line.length > 74) { out.push(line.slice(0, 74)); line = " " + line.slice(74); }
    out.push(line);
    return out.join("\r\n");
  }
  function buildICS() {
    const favOnly = $("#cal-fav").checked;
    const evs = [];
    CYCLES.forEach((c) => {
      if (favOnly && !isFav(c.org.id)) return;
      if (c.org.pending) return;
      cycleEvents(c).forEach((e) => {
        if (!evTypeOn.has(e.type.key)) return;
        if (e.conf !== "confirmed" || !e.d.date || e.d.alternatives) return;
        if (e.d.date < TODAY) return;
        evs.push(e);
      });
    });
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fertility Grant Finder//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Fertility grant dates"];
    evs.forEach((e) => {
      const c = e.cycle;
      const d = e.d.date.replace(/-/g, "");
      const [y, m, dd] = e.d.date.split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, dd + 1));
      const dEnd = next.getUTCFullYear() + pad(next.getUTCMonth() + 1) + pad(next.getUTCDate());
      const timePart = e.d.time ? " (" + fmtTime(e.d.time) + (e.d.tz_label ? " " + e.d.tz_label : "") + ")" : "";
      const summary = `${e.type.label}: ${c.org.name}, ${c.cycle_label}${timePart}`;
      const desc = `${c.org.program_name}. Confirmed on the official source as of ${c.org.last_verified_at || "an unknown date"}. Check before relying on it: ${c.source_url || c.org.official_url}`;
      lines.push("BEGIN:VEVENT", `UID:${c.id}-${e.type.key}@fertility-grant-finder`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${dEnd}`,
        foldLine("SUMMARY:" + icsEscape(summary)), foldLine("DESCRIPTION:" + icsEscape(desc)), foldLine("URL:" + (c.source_url || c.org.official_url)), "TRANSP:TRANSPARENT", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return { text: lines.join("\r\n"), count: evs.length };
  }

  const fileDlg = $("#filedlg");
  let fileURL = null;
  function offerFile(name, mime, text, note) {
    if (fileURL) URL.revokeObjectURL(fileURL);
    fileURL = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = $("#filedlg-dl");
    a.href = fileURL;
    a.setAttribute("download", name);
    a.textContent = "Download " + name;
    $("#filedlg-note").textContent = note;
    $("#filedlg-text").value = text;
    $("#filedlg-status").textContent = "";
    fileDlg.showModal();
  }

  // ---------- Static sections ----------
  function renderStatic() {
    const m = DATA.meta;
    const links = (m.credit.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ");
    $("#credit").innerHTML = `${esc(m.credit.line)} <span class="muted">Listen on</span> ${links}`;
    $("#about-credit").innerHTML = `${esc(m.credit.about)} Listen on ${links}.`;
    const upd = "Grant information last updated " + fmtDate(m.data_updated) + ".";
    $("#foot-updated").textContent = upd;
    $("#about-updated").textContent = upd + " Research first compiled " + fmtDate(m.research_compiled) + ".";
    if (m.suggestion_form_url) {
      ["#suggest-link", "#foot-suggest-link"].forEach((s) => { $(s).href = m.suggestion_form_url; });
      $("#suggest-wrap").hidden = false;
      $("#foot-suggest").hidden = false;
    }
    $("#legend").innerHTML = Object.keys(CONF_LABEL).map((k) => `<dt>${chip(k)}</dt><dd>${esc(CONF_HELP[k])}</dd>`).join("");
    $("#resources-list").innerHTML = (DATA.resources || []).map((r) => `<article class="res-item">
      <h3><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></h3>
      <p class="muted">${esc(r.type)} · ${esc(r.last_verified_at ? "Checked " + fmtDate(r.last_verified_at) : "Not rechecked")}</p>
      <p>${esc(r.description)}</p>${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}</article>`).join("");
    if (PREVIEW) {
      $("#preview-banner").hidden = false;
      $("#preview-banner").innerHTML = `<p class="preview-note"><strong>Private preview.</strong> Includes ${CANDIDATES.length} programs pending your review, marked "Pending review". They don't appear on the public site until you approve them. Downloads may not work in this preview; use "Copy text" instead.</p>`;
    }
    $("#pref-central").checked = !!store.prefs.central;
  }

  // ---------- Tabs / routing ----------
  const VIEWS = ["find", "calendar", "tracker", "resources", "about"];
  function showView(name) {
    if (!VIEWS.includes(name)) name = "find";
    VIEWS.forEach((v) => { $("#view-" + v).hidden = v !== name; });
    $$(".tabs a").forEach((a) => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (name === "calendar") renderCalendar();
    if (name === "tracker") renderTracker();
    if (name === "find") renderFind();
  }
  function route() {
    const h = location.hash.replace(/^#/, "");
    if (h.startsWith("grant-")) {
      const id = h.slice(6);
      if (ORG_BY_ID[id]) { showView("find"); openDetail(id); return; }
    }
    if (detail.open) detail.close();
    showView(h || "find");
  }

  // ---------- Events ----------
  function rerenderAll() {
    if (!$("#view-find").hidden) renderFind();
    if (!$("#view-calendar").hidden) renderCalendar();
    if (!$("#view-tracker").hidden) renderTracker();
    updateTrackerCount();
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    const openBtn = t.closest("[data-open]");
    if (openBtn) { openDetail(openBtn.getAttribute("data-open"), openBtn.getAttribute("data-cycle-focus")); return; }
    const fav = t.closest("[data-fav]");
    if (fav) {
      const id = fav.getAttribute("data-fav");
      toggleFav(id);
      $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => { b.setAttribute("aria-pressed", isFav(id)); b.textContent = isFav(id) ? "★ Saved" : "☆ Save"; });
      updateTrackerCount();
      if (!$("#view-tracker").hidden || F.fav.checked) rerenderAll();
      return;
    }
    if (t.closest("[data-close]")) { const d = t.closest("dialog"); if (d) d.close(); return; }
    if (t.id === "clear-all") {
      $("#clear-confirm").innerHTML = `<span class="confirm-inline">Remove all saved grants and tracker notes from this browser? <button type="button" class="btn" id="clear-yes">Yes, clear</button> <button type="button" class="btn" id="clear-no">Cancel</button></span>`;
      return;
    }
    if (t.id === "clear-yes") { store.favorites = []; store.tracking = {}; save(); renderTracker(); updateTrackerCount(); return; }
    if (t.id === "clear-no") { $("#clear-confirm").innerHTML = ""; return; }
    if (t.id === "export-tracker") { offerFile("my-grant-tracker.csv", "text/csv", trackerCSV(), "Your saved grants and tracker entries from this browser."); return; }
  });

  detail.addEventListener("close", () => {
    if (location.hash.startsWith("#grant-")) history.replaceState(null, "", "#find");
    rerenderAll();
  });
  detail.addEventListener("click", (ev) => { if (ev.target === detail) detail.close(); });
  fileDlg.addEventListener("click", (ev) => { if (ev.target === fileDlg) fileDlg.close(); });

  let trackTimer = null;
  detail.addEventListener("input", (ev) => {
    const form = ev.target.closest("form[data-track]");
    if (!form) return;
    clearTimeout(trackTimer);
    trackTimer = setTimeout(() => saveTrackForm(form), 250);
  });
  detail.addEventListener("change", (ev) => {
    const form = ev.target.closest("form[data-track]");
    if (form) saveTrackForm(form);
  });
  detail.addEventListener("submit", (ev) => ev.preventDefault());

  [F.q].forEach((el) => el.addEventListener("input", renderFind));
  [F.year, F.month, F.conf, F.geo, F.state, F.clinic, F.treat, F.fee, F.fav, F.sort].concat(STATUS_BOXES).forEach((el) => el.addEventListener("change", renderFind));
  $("#reset-filters").addEventListener("click", () => {
    F.q.value = "";
    [F.year, F.month, F.conf, F.geo, F.state, F.clinic, F.treat, F.fee].forEach((s) => { s.value = ""; });
    F.fav.checked = false;
    STATUS_BOXES.forEach((b) => { b.checked = b.value !== "archive"; });
    renderFind();
  });
  function setLayout(l) {
    layout = l;
    store.prefs.layout = l; save();
    $("#view-cards").setAttribute("aria-pressed", l === "cards");
    $("#view-table").setAttribute("aria-pressed", l === "table");
    renderFind();
  }
  $("#view-cards").addEventListener("click", () => setLayout("cards"));
  $("#view-table").addEventListener("click", () => setLayout("table"));
  $("#export-csv").addEventListener("click", () => {
    const list = sortCycles(CYCLES.filter((c) => matches(c, currentOpts()) && !c.org.pending), F.sort.value);
    offerFile("fertility-grants.csv", "text/csv", grantsCSV(list), `${list.length} grant cycles matching your current filters. Unknown values are left blank; check each official source before relying on a date.`);
  });
  $("#export-ics").addEventListener("click", () => {
    const r = buildICS();
    offerFile("fertility-grant-dates.ics", "text/calendar", r.text, r.count
      ? `${r.count} upcoming confirmed dates for the event types you selected. Dates that need confirmation, month-only dates, and recurring patterns are left out. Import this file into your calendar app. It doesn't create reminders; set those in your calendar app.`
      : "There are no upcoming confirmed dates for the event types you selected.");
  });
  $("#filedlg-copy").addEventListener("click", () => {
    const ta = $("#filedlg-text");
    const done = (ok) => { $("#filedlg-status").textContent = ok ? "Copied." : "Select the text below and copy it."; if (!ok) { ta.focus(); ta.select(); } };
    try { navigator.clipboard.writeText(ta.value).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  });

  $("#cal-prev").addEventListener("click", () => { const [y, m] = calMonth.split("-").map(Number); const d = new Date(Date.UTC(y, m - 2, 1)); calMonth = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1); renderCalendar(); });
  $("#cal-next").addEventListener("click", () => { const [y, m] = calMonth.split("-").map(Number); const d = new Date(Date.UTC(y, m, 1)); calMonth = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1); renderCalendar(); });
  $("#cal-today").addEventListener("click", () => { calMonth = THIS_MONTH; renderCalendar(); });
  ["#cal-fav", "#cal-unconfirmed", "#tl-past"].forEach((s) => $(s).addEventListener("change", renderCalendar));
  $("#event-types").addEventListener("change", (ev) => {
    const v = ev.target.value;
    if (ev.target.checked) evTypeOn.add(v); else evTypeOn.delete(v);
    store.prefs.evTypes = Array.from(evTypeOn); save();
    renderCalendar();
  });
  $("#pref-central").addEventListener("change", (ev) => { store.prefs.central = ev.target.checked; save(); });

  window.addEventListener("hashchange", route);

  // ---------- Boot ----------
  fillSelects();
  renderTypes();
  renderStatic();
  $("#view-cards").setAttribute("aria-pressed", layout === "cards");
  $("#view-table").setAttribute("aria-pressed", layout === "table");
  updateTrackerCount();
  route();

  // Exposed for testing in the browser console
  window.FGF_DEBUG = { cycleStatus, CYCLES, TODAY, zonedToUtc, inZone, buildICS, grantsCSV };
})();
