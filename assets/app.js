/* Fertility Grant Finder — app logic. Data lives in data/grants.js. */
(function () {
  "use strict";

  const DATA = window.FGF_DATA;
  const PREVIEW = !!window.FGF_PREVIEW;
  const CANDIDATES = PREVIEW && Array.isArray(window.FGF_CANDIDATES) ? window.FGF_CANDIDATES : [];

  // ---------- Constants ----------
  const CORE = window.FGF_CORE;
  const { MONTHS, MON, DOW, STATE_NAMES, CONF_LABEL, CONF_HELP, STATUS_LABEL, GROUP_OF, pad, esc, lastDayOfMonth, weekday, fmtDate, fmtMonth, fmtTime, fmtMoney,
    dateConf, allDates, dEarliest, dLatest, awardText, feeText, geoShort, clinicKind, clinicShort, verifiedText } = CORE;
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

  const TODAY = CORE.todayISO();
  const cycleStatus = (c) => CORE.cycleStatus(c, TODAY);
  const reqShort = CORE.reqShort;
  const THIS_MONTH = TODAY.slice(0, 7);


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

  // ---------- Published requirements ----------
  const REQ_ROWS = [
    ["married", "Legally married"],
    ["us_citizen", "U.S. citizenship"],
    ["us_status", "U.S. citizen or permanent/legal resident"],
    ["diagnosis", "Infertility diagnosis"],
    ["no_children", "No children already"],
    ["employment", "Someone in the household employed"],
    ["health_insurance", "Health insurance"],
    ["attend_event", "Attend an event in person"]
  ];
  function reqOf(c) {
    const base = c.org.requirements || {};
    return c.requirements_override ? { ...base, ...c.requirements_override } : base;
  }
  function reqValueText(v) {
    if (v === true) return "Required";
    if (v === false) return "Not required";
    if (v === "some") return "Required for some applicants";
    return null;
  }
  const REQ_INPUTS = () => $$("[data-req]");
  function readMe() {
    const me = { flags: new Set(REQ_INPUTS().filter((b) => b.checked).map((b) => b.dataset.req)) };
    const kids = $("#rq-kids").value; me.kids = kids === "" ? null : Number(kids);
    const age = parseInt($("#rq-age").value, 10); me.age = Number.isFinite(age) ? age : null;
    const inc = parseInt($("#rq-income").value, 10); me.income = Number.isFinite(inc) ? inc : null;
    me.active = me.flags.size > 0 || me.kids != null || me.age != null || me.income != null;
    return me;
  }
  // Reasons a grant's published rules don't fit the visitor's answers. Unpublished rules never exclude.
  function reqConflicts(c, me) {
    if (!me || !me.active) return [];
    const r = reqOf(c);
    const out = [];
    if (me.flags.has("married") && r.married === true) out.push("requires marriage");
    if (me.flags.has("us_citizen") && r.us_citizen === true) out.push("requires U.S. citizenship");
    if (me.flags.has("us_status") && (r.us_status === true || r.us_citizen === true)) out.push("requires U.S. citizenship or residency");
    if (me.flags.has("diagnosis") && r.diagnosis === true) out.push("requires a diagnosis");
    if (me.flags.has("employment") && r.employment === true) out.push("requires employment");
    if (me.flags.has("health_insurance") && r.health_insurance === true) out.push("requires health insurance");
    if (me.flags.has("attend_event") && r.attend_event === true) out.push("requires attending in person");
    if (me.kids != null && me.kids >= 1 && r.no_children === true) out.push("for people without children");
    if (me.kids != null && r.children_max != null && me.kids > r.children_max) out.push(`allows up to ${r.children_max} children`);
    if (me.age != null && r.age_min != null && me.age < r.age_min) out.push(`minimum age ${r.age_min}`);
    if (me.age != null && r.age_max != null && me.age > r.age_max) out.push(`maximum age ${r.age_max}`);
    if (me.income != null && r.income_max != null && me.income > r.income_max) out.push(`income limit ${fmtMoney(r.income_max, "USD")}`);
    return out;
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
    parts.push(reqShort(reqOf(c)).join(" "), ((o.requirements && o.requirements.other) || []).join(" "));
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
    const states = Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b]));
    F.state.innerHTML = '<option value="">Any state</option>' + states.map((s) => `<option value="${s}">${esc(STATE_NAMES[s])}</option>`).join("");
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
    if (opts.state && !(o.geography && ((o.geography.states || []).includes(opts.state) || o.geography.type === "us_national"))) return false;
    if (opts.clinic && clinicKind(o) !== opts.clinic) return false;
    if (opts.treat && !(o.treatments_covered || []).includes(opts.treat)) return false;
    if (opts.fee && feeKind(o) !== opts.fee) return false;
    if (opts.fav && !isFav(o.id)) return false;
    if (!opts.ignoreReq && reqConflicts(c, opts.me).length) return false;
    return true;
  }

  function currentOpts() {
    return {
      q: F.q.value.trim(),
      statuses: new Set(STATUS_BOXES.filter((b) => b.checked).map((b) => b.value)),
      year: F.year.value, month: F.month.value, conf: F.conf.value, geo: F.geo.value, state: F.state.value,
      clinic: F.clinic.value, treat: F.treat.value, fee: F.fee.value, fav: F.fav.checked,
      me: readMe()
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


  function trackLabel(cycleId) {
    const t = store.tracking[cycleId];
    if (!t || !t.status) return "";
    const s = TRACK_STATUSES.find((x) => x[0] === t.status);
    return s ? s[1] : "";
  }

  function moreLink(o) {
    const links = o.links || [];
    return links.find((l) => l.label !== "Website") || links[0] || { url: o.official_url };
  }

  function cardLedger(c) {
    const rows = [];
    const longText = (t) => `<span class="clamp">${esc(t)}</span>`;
    if (c.kind === "rolling") {
      rows.push(["Applications", `<span class="dv">Accepted year-round</span>`]);
      if (c.notification_window_text) rows.push(["Decisions", longText(c.notification_window_text)]);
    } else if (c.kind === "awaiting" || c.kind === "paused") {
      rows.push(["Next dates", `<span class="dv na">Not announced yet</span>${chip(c.date_confidence === "recurring" ? "recurring" : (c.kind === "paused" ? "needs_confirmation" : "not_announced"))}`]);
      if (c.recurring_text) rows.push(["Past pattern", longText(c.recurring_text)]);
    } else if (c.kind === "event") {
      rows.push(["Event", dateValueHTML(c.event_date, c, { weekday: true })]);
    } else {
      const st = cycleStatus(c);
      if (st !== "open" || c.application_opens_at) rows.push(["Opens", dateValueHTML(c.application_opens_at, c, { naText: c.open_verified_on ? "Open now" : "Not announced" })]);
      if (c.start_application_deadline_at && dLatest(c.start_application_deadline_at) >= TODAY) rows.push(["Start by", dateValueHTML(c.start_application_deadline_at, c, {})]);
      rows.push(["Deadline", dateValueHTML(c.submission_deadline_at, c, { weekday: true }), true]);
      if (c.notification_date) rows.push(["Decisions", dateValueHTML(c.notification_date, c, {})]);
      else rows.push(["Decisions", c.notification_window_text ? longText(c.notification_window_text) : `<span class="dv na">Not announced</span>`]);
    }
    return `<dl class="ledger">${rows.map(([k, v, key]) => `<dt${key ? ' class="key"' : ""}>${esc(k)}</dt><dd${key ? ' class="key"' : ""}>${v}</dd>`).join("")}</dl>`;
  }

  function card(c) {
    const o = c.org;
    const st = cycleStatus(c);
    const tl = trackLabel(c.id);
    const statusExtra = st === "pending" && c.notification_date ? `<p class="note">Closed. Decisions expected by ${esc(fmtDate(dLatest(c.notification_date)))}.</p>` : (st === "check" ? `<p class="note">The announced opening has passed and no deadline is listed yet. Check the official source.</p>` : "");
    const review = o.pending ? `<p class="note-box"><strong>Pending your review.</strong> ${esc(o.review && o.review.why || "")} Not shown on the public site.</p>` : "";
    const fee = o.application_fee === 0 ? "No fee" : (o.application_fee == null ? "Fee not announced" : feeText(o) + " fee");
    const award = awardText(o) === "Not announced" ? "Award not announced" : awardText(o);
    const tags = [award, fee, geoShort(o) === "Not stated" ? "Location not stated" : geoShort(o)];
    if (clinicKind(o) === "yes") tags.push("Partner clinic required");
    return `<article class="card${o.pending ? " is-pending" : ""}" data-cycle="${esc(c.id)}">
      <div class="card-top">${pill(st)}${o.pending ? '<span class="pill review">Pending review</span>' : ""}<span class="cycle-tag">${esc(c.cycle_label)}</span></div>
      <div class="card-title">
        <h4><button type="button" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">${esc(o.name)}</button></h4>
        <p class="card-sub">${esc(o.program_name)}</p>
      </div>
      ${review}
      ${cardLedger(c)}
      ${statusExtra}
      <div class="card-meta">${tags.map((t) => `<span class="meta-tag">${esc(t)}</span>`).join("")}</div>
      <p class="req-line">${reqShort(reqOf(c)).length ? `<strong>Requires:</strong> ${esc(reqShort(reqOf(c)).join(", "))}` : "Requirements not fully published. Check their website."}</p>
      <div class="card-foot">
        <div class="card-actions">
          <button type="button" class="btn fav-btn" data-fav="${esc(o.id)}" aria-pressed="${isFav(o.id)}">${isFav(o.id) ? "★ Saved" : "☆ Save"}</button>
          <button type="button" class="btn" data-track-open="${esc(c.id)}">${tl ? "Tracking: " + esc(tl) : "Track"}</button>
          <button type="button" class="btn btn-primary btn-more" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">Details</button>
        </div>
        <p class="src-line"><a href="${esc(moreLink(o).url)}" target="_blank" rel="noopener">More on their website</a> · <a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source for these dates</a> · ${esc(verifiedText(o))}</p>
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
    { key: "upcoming", title: "Upcoming", help: "Announced application rounds that haven't opened yet, or that have a future deadline or event." },
    { key: "rolling", title: "Rolling, year-round", help: "Applications accepted at any time, usually depending on available funding." },
    { key: "tba", title: "Dates to be announced", help: "Programs that haven't announced their next round yet. Past patterns are shown for reference only." },
    { key: "archive", title: "Past rounds", help: "Closed application rounds, kept with their original dates." }
  ];

  let layout = store.prefs.layout === "table" ? "table" : "cards";

  function renderFind() {
    const opts = currentOpts();
    const list = sortCycles(CYCLES.filter((c) => matches(c, opts)), F.sort.value);
    const hiddenByReq = opts.me.active ? CYCLES.filter((c) => matches(c, { ...opts, ignoreReq: true }) && reqConflicts(c, opts.me).length) : [];
    const hiddenOrgs = new Set(hiddenByReq.map((c) => c.org.id)).size;
    $("#req-status").textContent = opts.me.active ? (hiddenByReq.length ? `Hiding ${hiddenOrgs} ${hiddenOrgs === 1 ? "grant that lists" : "grants that list"} a requirement you don't meet` : "No grants hidden by your answers") : "";
    const orgCount = new Set(list.map((c) => c.org.id)).size;
    $("#result-count").innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? "application round" : "application rounds"} from <strong>${orgCount}</strong> ${orgCount === 1 ? "organization" : "organizations"}`;
    const moreActive = [F.conf, F.geo, F.clinic, F.fee].filter((s) => s.value).length;
    $("#more-count").textContent = moreActive ? `(${moreActive} on)` : "";
    const statusDefault = STATUS_BOXES.every((b) => b.checked === (b.value !== "archive"));
    const allActive = [F.year, F.month, F.conf, F.geo, F.state, F.clinic, F.treat, F.fee].filter((s) => s.value).length + (F.fav.checked ? 1 : 0) + (statusDefault ? 0 : 1);
    $("#filters-on").textContent = allActive ? `(${allActive} on)` : "";
    syncQuick();
    const out = $("#results");
    if (!list.length) {
      out.innerHTML = `<p class="empty">No grants match these filters. Try removing a filter, clearing your answers in "Check requirements", or tap "Past rounds".</p>`;
      return;
    }
    const stateNote = F.state.value ? `<p class="state-note"><span>Showing grants for <strong>${esc(STATE_NAMES[F.state.value])}</strong> residents: local grants plus grants open anywhere in the U.S.</span> <a href="states/${CORE.slug(STATE_NAMES[F.state.value])}/">${esc(STATE_NAMES[F.state.value])} grants page</a> <button type="button" class="btn-link" data-state-clear>Show all states</button></p>` : "";
    const reqNote = stateNote + (hiddenByReq.length ? `<p class="hidden-note">${hiddenOrgs} ${hiddenOrgs === 1 ? "grant is" : "grants are"} hidden because ${hiddenOrgs === 1 ? "its" : "their"} published rules don't fit your answers: ${esc([...new Set(hiddenByReq.map((c) => c.org.name))].join(", "))}. <button type="button" class="btn-link" data-req-clear>Show all grants again</button></p>` : "");
    if (layout === "table") { out.innerHTML = reqNote + tableHTML(list); return; }
    out.innerHTML = reqNote + GROUPS.map((g) => {
      const items = list.filter((c) => GROUP_OF[cycleStatus(c)] === g.key);
      if (!items.length) return "";
      return `<section class="group" aria-label="${esc(g.title)}">
        <div class="group-head"><h3>${esc(g.title)}</h3><p>${esc(g.help)}</p></div>
        <div class="cards">${items.map(card).join("")}</div>
      </section>`;
    }).join("");
  }

  // ---------- Shortcuts ----------
  const QUICK = {
    default: { statuses: ["open", "upcoming", "rolling", "tba"] },
    open: { statuses: ["open", "rolling"] },
    upcoming: { statuses: ["upcoming"] },
    national: { statuses: ["open", "upcoming", "rolling", "tba"], geo: "us_national" },
    saved: { statuses: ["open", "upcoming", "rolling", "tba", "archive"], fav: true },
    archive: { statuses: ["archive"] }
  };
  function applyQuick(key) {
    const q = QUICK[key];
    if (!q) return;
    [F.year, F.month, F.conf, F.geo, F.state, F.clinic, F.treat, F.fee].forEach((sel) => { sel.value = ""; });
    STATUS_BOXES.forEach((b) => { b.checked = q.statuses.includes(b.value); });
    F.geo.value = q.geo || "";
    F.fav.checked = !!q.fav;
    renderFind();
  }
  function syncQuick() {
    const statuses = STATUS_BOXES.filter((b) => b.checked).map((b) => b.value).sort().join(",");
    const others = [F.year, F.month, F.conf, F.state, F.clinic, F.treat, F.fee].some((sel) => sel.value);
    let active = null;
    if (!others) {
      Object.entries(QUICK).forEach(([k, q]) => {
        if (active) return;
        if (q.statuses.slice().sort().join(",") === statuses && (q.geo || "") === F.geo.value && !!q.fav === F.fav.checked) active = k;
      });
    }
    $$(".quick button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.quick === active)));
  }

  // ---------- Logos (shown only if the image files exist) ----------
  function loadLogos() {
    const big = new Image();
    big.onload = () => { $("#brand-logo").src = big.src; $("#logo-badge").hidden = false; };
    big.src = "assets/logo.png";
    const small = new Image();
    small.onload = () => { const f = $("#foot-logo"); f.src = small.src; f.hidden = false; };
    small.src = "assets/logo-road.png";
  }

  // ---------- How it works panel ----------
  function setHowto(hidden) {
    $("#howto").hidden = hidden;
    $("#howto-show-wrap").hidden = !hidden;
    store.prefs.howtoHidden = hidden;
    save();
  }

  // ---------- Detail dialog ----------
  const detail = $("#detail");
  function openDetail(orgId, focusCycleId, openTracker) {
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
        <p class="note"><a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source for this round</a></p>
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
      <section class="detail-section"><h3>More details on their website</h3>
        <div class="link-list">${(o.links || [{ label: "Official website", url: o.official_url }]).map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>
        <p class="ask-line">Have a question about eligibility, dates, or fees? Ask ${esc(o.name)} directly: <a href="${esc(CORE.questionLink(o).url)}" target="_blank" rel="noopener">${esc(CORE.questionLink(o).label === "Website" ? "visit their website" : CORE.questionLink(o).label)}</a>.</p>
        <p class="note">Links checked ${esc(fmtDate((o.requirements && o.requirements.checked_on) || o.last_verified_at || DATA.meta.data_updated))}.</p>
      </section>
      <section class="detail-section"><h3>Requirements at a glance</h3>
        <p class="note">From the organization's published rules. "Not stated" means we couldn't find it, not that there's no rule. Only the organization can decide whether you qualify.</p>
        ${reqTable(o)}
      </section>
      <section class="detail-section"><h3>Review eligibility</h3>
        ${list(o.eligibility_notes)}
      </section>
      <section class="detail-section"><h3>What's covered and not covered</h3>${list(o.coverage_notes)}</section>
      <section class="detail-section"><h3>Current and upcoming rounds</h3>
        ${current.length ? current.map((c) => cycleBlock(c, false)).join("") : '<p class="muted">No current or upcoming round has been announced.</p>'}
      </section>
      ${past.length ? `<section class="detail-section"><h3>Past rounds</h3>${past.map((c) => cycleBlock(c, true)).join("")}</section>` : ""}
      ${(o.research_notes || []).length ? `<section class="detail-section"><h3>Research notes</h3>${list(o.research_notes)}</section>` : ""}
      <section class="detail-section"><h3>Sources</h3><ul>${(o.source_urls || []).map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join("")}</ul></section>
    `;
    if (!detail.open) detail.showModal();
    const target = focusCycleId && document.getElementById("cb-" + focusCycleId);
    if (openTracker && target) {
      const d = $("details.tracker-form", target);
      if (d) { d.open = true; d.scrollIntoView({ block: "start" }); const sel = $("select", d); if (sel) sel.focus(); return; }
    }
    if (target && focusCycleId !== cycles[0].id) target.scrollIntoView({ block: "start" });
    else $(".dialog-inner", detail).scrollTop = 0;
    if (location.hash !== "#grant-" + orgId) history.replaceState(null, "", "#grant-" + orgId);
  }

  function reqTable(o) {
    const r = o.requirements || {};
    const rows = REQ_ROWS.map(([k, label]) => {
      let v = reqValueText(r[k]);
      if (k === "us_citizen" && r.us_citizen === false && r.us_status === true) v = "Not required (residents can apply)";
      if (k === "no_children" && r.children_max != null && r.no_children !== true) v = `Up to ${r.children_max} ${r.children_max === 1 ? "child" : "children"} allowed`;
      return [label, v];
    });
    const age = r.age_min != null || r.age_max != null ? (r.age_min != null && r.age_max != null ? `${r.age_min} to ${r.age_max}` : (r.age_min != null ? `${r.age_min} or older` : `${r.age_max} or younger`)) : null;
    rows.push(["Age", age]);
    rows.push(["Household income", r.income_max != null ? `Up to ${fmtMoney(r.income_max, "USD")}` : null]);
    const other = (r.other || []).length ? `<ul>${r.other.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    return `<dl class="req-table">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd${v ? "" : ' class="ns"'}>${esc(v || "Not stated")}</dd>`).join("")}</dl>${other}`;
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
          if (!c) return `<tr><td colspan="9">A tracked application round (${esc(cid)}) is no longer listed. Your notes: ${esc(t.notes || "none")}</td></tr>`;
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
      $("#preview-banner").innerHTML = CANDIDATES.length
        ? `<p class="preview-note"><strong>Private preview.</strong> Includes ${CANDIDATES.length} ${CANDIDATES.length === 1 ? "program" : "programs"} pending your review, marked "Pending review". They don't appear on the public site until you approve them. Downloads may not work in this preview; use "Copy text" instead.</p>`
        : `<p class="preview-note"><strong>Private preview.</strong> No programs are waiting for your review. Downloads may not work in this preview; use "Copy text" instead.</p>`;
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
    if (h.startsWith("state-")) {
      const code = h.slice(6).toUpperCase();
      if (STATE_NAMES[code]) { F.state.value = code; showView("find"); return; }
    }
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
    const trackBtn = t.closest("[data-track-open]");
    if (trackBtn) { const c = CYCLE_BY_ID[trackBtn.getAttribute("data-track-open")]; if (c) openDetail(c.org.id, c.id, true); return; }
    if (t.closest("[data-req-clear]")) { clearReq(); return; }
    if (t.closest("[data-state-clear]")) { F.state.value = ""; if (location.hash.startsWith("#state-")) history.replaceState(null, "", "#find"); renderFind(); return; }
    const quickBtn = t.closest("[data-quick]");
    if (quickBtn) { applyQuick(quickBtn.dataset.quick); return; }
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
  const reqPanel = $("#req-check");
  reqPanel.addEventListener("change", renderFind);
  reqPanel.addEventListener("input", (ev) => { if (ev.target.type === "number") renderFind(); });
  function clearReq() {
    REQ_INPUTS().forEach((b) => { b.checked = false; });
    $("#rq-kids").value = ""; $("#rq-age").value = ""; $("#rq-income").value = "";
    renderFind();
  }
  $("#rq-clear").addEventListener("click", clearReq);
  $("#reset-filters").addEventListener("click", () => {
    F.q.value = "";
    [F.year, F.month, F.conf, F.geo, F.state, F.clinic, F.treat, F.fee].forEach((s) => { s.value = ""; });
    F.fav.checked = false;
    STATUS_BOXES.forEach((b) => { b.checked = b.value !== "archive"; });
    renderFind();
  });
  const filtersPanel = $("#filters");
  function setFiltersOpen(open) {
    filtersPanel.classList.toggle("is-open", open);
    $("#filters-toggle").setAttribute("aria-expanded", String(open));
  }
  $("#filters-toggle").addEventListener("click", () => {
    const open = !filtersPanel.classList.contains("is-open");
    setFiltersOpen(open);
    if (open) filtersPanel.scrollIntoView({ block: "start" });
  });
  $("#filters-done").addEventListener("click", () => { setFiltersOpen(false); $("#results").scrollIntoView({ block: "start" }); });
  $("#howto-hide").addEventListener("click", () => setHowto(true));
  $("#howto-show").addEventListener("click", () => setHowto(false));

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
    offerFile("fertility-grants.csv", "text/csv", grantsCSV(list), `${list.length} application rounds matching your current filters. Unknown values are left blank; check each official source before relying on a date.`);
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
  loadLogos();
  if (store.prefs.howtoHidden) { $("#howto").hidden = true; $("#howto-show-wrap").hidden = false; }
  renderTypes();
  renderStatic();
  $("#view-cards").setAttribute("aria-pressed", layout === "cards");
  $("#view-table").setAttribute("aria-pressed", layout === "table");
  updateTrackerCount();
  route();

  // Exposed for testing in the browser console
  window.FGF_DEBUG = { cycleStatus, CYCLES, TODAY, zonedToUtc, inZone, buildICS, grantsCSV };
})();
