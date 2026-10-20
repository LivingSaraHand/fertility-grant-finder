/* Fertility Grant Finder — shared rules for dates, statuses, and labels.
   Used by the main finder (assets/app.js), the grant and state pages, and the page builder (tools/build-pages.mjs). */
(function (root) {
  "use strict";

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
  const GROUP_OF = { open: "open", upcoming: "upcoming", rolling: "rolling", tba: "tba", check: "tba", paused: "tba", pending: "archive", closed: "archive" };

  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function todayISO() {
    if (typeof root.FGF_TODAY === "string" && root.FGF_TODAY) return root.FGF_TODAY;
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
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

  // Status of one application round on a given day (YYYY-MM-DD).
  function cycleStatus(c, today) {
    if (c.kind === "rolling") return "rolling";
    if (c.kind === "paused") return "paused";
    if (c.kind === "awaiting") return "tba";
    if (c.kind === "event") {
      const e = dLatest(c.event_date);
      if (!e) return "tba";
      return e < today ? "closed" : "upcoming";
    }
    const sub = c.submission_deadline_at;
    const op = c.application_opens_at;
    const closedOrPending = () => {
      const n = dLatest(c.notification_date);
      return n && n >= today ? "pending" : "closed";
    };
    if (sub && dLatest(sub) < today) return closedOrPending();
    if (!sub && (c.closed_verified_on || c.date_confidence === "historical")) return closedOrPending();
    if (op) {
      const early = dEarliest(op);
      const late = dLatest(op);
      if (early > today) return "upcoming";
      if (late >= today && early !== late && !c.open_verified_on) return "upcoming"; // opening month or conflicting days include today
      if (c.open_verified_on) return "open";
      // The opening has passed. With a future deadline, or a confirmed exact opening date, the round is open.
      if (sub || (op.date && !op.alternatives && dateConf(op, c) === "confirmed")) return "open";
      // An opening month (or uncertain date) has passed and no deadline is listed yet
      return "check";
    }
    if (c.open_verified_on) return "open";
    if (sub) return "upcoming";
    return "tba";
  }

  // ---------- Organization summaries ----------
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
  function clinicKind(o) {
    if (o.clinic_required === true) return "yes";
    if (o.clinic_required === false) return "no";
    return "unknown";
  }
  function clinicShort(o) {
    const k = clinicKind(o);
    return k === "yes" ? "Partner clinic required" : k === "no" ? "Any eligible clinic" : "Not stated";
  }
  function verifiedText(o) {
    return o.last_verified_at ? "Checked " + fmtDate(o.last_verified_at) : "Not yet verified";
  }
  function reqShort(r) {
    r = r || {};
    const out = [];
    if (r.married === true) out.push("married");
    if (r.us_citizen === true) out.push("U.S. citizen");
    else if (r.us_status === true) out.push("U.S. citizen or resident");
    if (r.diagnosis === true) out.push("diagnosis");
    if (r.no_children === true) out.push("no children");
    else if (r.children_max != null) out.push(`up to ${r.children_max} ${r.children_max === 1 ? "child" : "children"}`);
    if (r.employment === true) out.push("employment");
    if (r.health_insurance === true) out.push("health insurance");
    if (r.attend_event === true) out.push("attend in person");
    if (r.age_min != null || r.age_max != null) out.push(r.age_min != null && r.age_max != null ? `ages ${r.age_min}–${r.age_max}` : (r.age_min != null ? `age ${r.age_min}+` : `age ${r.age_max} or under`));
    if (r.income_max != null) out.push(`income up to ${fmtMoney(r.income_max, "USD")}`);
    return out;
  }
  // Plain-language names for treatment tags in the data.
  const TREAT_LABEL = {
    "IVF": "IVF",
    "IUI": "IUI (insemination)",
    "FET": "Frozen embryo transfer",
    "PGT": "Genetic testing of embryos (PGT)",
    "Donor eggs/sperm": "Donor eggs or sperm",
    "Embryo donation/adoption": "Embryo donation or adoption",
    "Egg freezing": "Egg freezing",
    "Surrogacy": "Surrogacy",
    "Adoption": "Adoption",
    "Medications": "Fertility medications",
    "General fertility treatment": "Fertility treatment (general)"
  };
  const treatLabel = (t) => TREAT_LABEL[t] || t;

  // Best page for questions: the organization's FAQ if listed, otherwise its website.
  function questionLink(o) {
    const links = o.links || [];
    return links.find((l) => /faq/i.test(l.label)) || links.find((l) => /^website$/i.test(l.label)) || links[0] || { label: "Website", url: o.official_url };
  }
  // Which states an organization serves, for state pages. Nationwide grants are listed on every state page.
  function servesState(o, code) {
    const g = o.geography || {};
    return g.type === "us_national" || (g.states || []).includes(code);
  }

  root.FGF_CORE = {
    MONTHS, MON, DOW, STATE_NAMES, CONF_LABEL, CONF_HELP, STATUS_LABEL, GROUP_OF,
    pad, esc, slug, todayISO, lastDayOfMonth, weekday, fmtDate, fmtMonth, fmtTime, fmtMoney,
    dateConf, allDates, dEarliest, dLatest, cycleStatus,
    awardText, feeText, geoShort, clinicKind, clinicShort, verifiedText, reqShort, servesState, questionLink, TREAT_LABEL, treatLabel
  };
})(typeof window !== "undefined" ? window : globalThis);
