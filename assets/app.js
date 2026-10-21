/* Family-Building Grant Finder — app logic. Data lives in data/grants.js. */
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

  // Lowercase and strip accents, so "adopción" matches "adopcion" and "FIV" matches "fiv".
  const norm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
  CYCLES.forEach((c) => {
    c._hay = norm(haystack(c));
    c._words = Array.from(new Set(c._hay.split(/[^a-z0-9+]+/).filter(Boolean)));
  });
  // Whole words only, so "fiv" doesn't match "five". Longer words may match the start of a word ("adopt" finds "adoption").
  const termMatch = (c, t) => c._words.includes(t) || (t.length >= 4 && c._words.some((w) => w.startsWith(t)));

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
    F.treat.innerHTML = '<option value="">Any treatment</option>' + Array.from(treats).sort((a, b) => CORE.treatLabel(a).localeCompare(CORE.treatLabel(b))).map((t) => `<option value="${esc(t)}">${esc(CORE.treatLabel(t))}</option>`).join("");
  }

  function cycleMonths(c) {
    const set = new Set();
    cycleEvents(c).forEach((e) => {
      if (e.d.date) allDates(e.d).forEach((x) => set.add(x.slice(0, 7)));
      else if (e.d.month) set.add(e.d.month);
    });
    return set;
  }

  // ---------- Smart search ----------
  // Turns everyday words ("Texas", "IVF", "single", "gay") into filters, so a search never
  // depends on a grant using the exact same words. Whatever isn't recognized is matched as text.
  const STATE_BY_NAME = Object.fromEntries(Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]));
  STATE_BY_NAME["washington dc"] = "DC"; STATE_BY_NAME["washington d.c."] = "DC"; STATE_BY_NAME["d.c."] = "DC";
  // Spanish state names
  Object.assign(STATE_BY_NAME, { "nueva york": "NY", "nuevo mexico": "NM", "nueva jersey": "NJ", "carolina del norte": "NC", "carolina del sur": "SC",
    "dakota del norte": "ND", "dakota del sur": "SD", "virginia occidental": "WV", "luisiana": "LA", "misuri": "MO", "pensilvania": "PA", "hawai": "HI" });
  const TREAT_WORDS = [
    // Spanish (longer phrases first)
    ["fecundacion in vitro", "IVF"], ["inseminacion artificial", "IUI"], ["transferencia de embriones congelados", "FET"], ["transferencia de embriones", "FET"],
    ["donacion de ovulos", "Donor eggs/sperm"], ["ovulos donados", "Donor eggs/sperm"], ["esperma de donante", "Donor eggs/sperm"], ["ovodonacion", "Donor eggs/sperm"],
    ["gestacion subrogada", "Surrogacy"], ["vientre de alquiler", "Surrogacy"], ["madre subrogada", "Surrogacy"], ["subrogacion", "Surrogacy"],
    ["congelacion de ovulos", "Egg freezing"], ["congelar ovulos", "Egg freezing"], ["preservacion de la fertilidad", "Egg freezing"],
    ["adopcion de embriones", "Embryo donation/adoption"], ["fiv", "IVF"], ["inseminacion", "IUI"], ["donante", "Donor eggs/sperm"],
    ["adopcion", "Adoption"], ["adoptar", "Adoption"], ["medicamentos", "Medications"],
    ["embryo adoption", "Embryo donation/adoption"], ["embryo donation", "Embryo donation/adoption"],
    ["frozen embryo transfer", "FET"], ["frozen embryo", "FET"], ["embryo transfer", "FET"],
    ["in vitro", "IVF"], ["ivf", "IVF"], ["iui", "IUI"], ["insemination", "IUI"], ["fet", "FET"],
    ["egg donor", "Donor eggs/sperm"], ["sperm donor", "Donor eggs/sperm"], ["donor eggs", "Donor eggs/sperm"], ["donor egg", "Donor eggs/sperm"],
    ["donor sperm", "Donor eggs/sperm"], ["donor conception", "Donor eggs/sperm"], ["donor", "Donor eggs/sperm"],
    ["gestational carrier", "Surrogacy"], ["surrogacy", "Surrogacy"], ["surrogate", "Surrogacy"],
    ["egg freezing", "Egg freezing"], ["freeze eggs", "Egg freezing"], ["freezing eggs", "Egg freezing"], ["fertility preservation", "Egg freezing"],
    ["genetic testing", "PGT"], ["pgt", "PGT"], ["medications", "Medications"], ["medication", "Medications"], ["meds", "Medications"],
    ["adoption", "Adoption"], ["adopt", "Adoption"]
  ];
  const AUDIENCE_WORDS = [
    ["same sex", "lgbtq"], ["same-sex", "lgbtq"], ["two dads", "lgbtq"], ["two moms", "lgbtq"], ["lgbtq+", "lgbtq"], ["lgbtq", "lgbtq"], ["lgbt", "lgbtq"],
    ["gay", "lgbtq"], ["lesbian", "lgbtq"], ["queer", "lgbtq"], ["trans", "lgbtq"],
    ["breast cancer", "cancer"], ["cancer", "cancer"], ["chemotherapy", "cancer"], ["chemo", "cancer"], ["quimioterapia", "cancer"], ["oncofertility", "cancer"],
    ["oncology", "cancer"], ["oncologist", "cancer"], ["leukemia", "cancer"], ["lymphoma", "cancer"],
    ["va benefits", "military"], ["va benefit", "military"], ["service member", "military"], ["servicemember", "military"], ["national guard", "military"], ["air force", "military"],
    ["veterans", "military"], ["veteran", "military"], ["veterano", "military"], ["military", "military"], ["militar", "military"], ["army", "military"], ["navy", "military"], ["marines", "military"], ["marine", "military"],
    ["single mom", "single"], ["single mother", "single"], ["single woman", "single"], ["single women", "single"], ["single dad", "single"], ["single", "single"], ["unmarried", "single"], ["not married", "single"]
  ];
  const FILLER = new Set(["grant", "grants", "fertility", "infertility", "help", "for", "in", "with", "money", "funding", "fund", "funds", "financial", "assistance",
    "the", "a", "an", "my", "me", "i", "we", "our", "near", "cost", "costs", "pay", "paying", "treatment", "treatments", "free", "and", "or", "of", "to", "who", "are", "is", "need", "looking", "find", "scholarship", "scholarships", "program", "programs", "resident", "residents", "state", "couple", "couples", "va",
    // Everyday family words people type ("gay dads", "army wife", "help for my wife and me")
    "dad", "dads", "mom", "moms", "mother", "mothers", "father", "fathers", "wife", "husband", "spouse", "partner", "partners", "parent", "parents", "family", "families",
    "baby", "babies", "us", "journey", "ttc", "trying", "get", "pregnant", "can", "afford", "cant", "can't",
    // Spanish filler words
    "ayuda", "ayudas", "para", "de", "del", "la", "el", "los", "las", "subvencion", "subvenciones", "beca", "becas", "fertilidad", "infertilidad", "tratamiento", "tratamientos",
    "dinero", "gratis", "en", "y", "o", "mi", "mis", "con", "por", "que", "un", "una", "programa", "programas", "apoyo", "financiera", "financiero", "costo", "costos", "pagar", "necesito", "busco"]);
  const SPANISH_HINTS = new Set(["ayuda", "ayudas", "para", "subvencion", "subvenciones", "beca", "becas", "fertilidad", "infertilidad", "tratamiento", "fiv", "fecundacion", "ovulos", "gestacion",
    "subrogada", "adopcion", "adoptar", "inseminacion", "embriones", "donante", "dinero", "necesito", "busco", "nueva", "quimioterapia", "veterano", "militar", "medicamentos"]);
  function parseQuery(raw) {
    let text = " " + norm(raw).replace(/[,;:!?¿¡]/g, " ").replace(/\s+/g, " ") + " ";
    const out = { state: "", treat: "", audience: new Set(), openNow: false, noFee: false, rest: "", understood: [], spanish: text.split(" ").some((w) => SPANISH_HINTS.has(w)) };
    const take = (phrase) => { const re = new RegExp("(^|\\s)" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=\\s|$)"); if (re.test(text)) { text = text.replace(re, " "); return true; } return false; };
    for (const name of Object.keys(STATE_BY_NAME).sort((a, b) => b.length - a.length)) {
      if (take(name)) { out.state = STATE_BY_NAME[name]; out.understood.push(STATE_NAMES[out.state]); break; }
    }
    for (const [phrase, tag] of TREAT_WORDS) { if (!out.treat && take(phrase)) { out.treat = tag; out.understood.push(CORE.treatLabel(tag)); } }
    for (const [phrase, who] of AUDIENCE_WORDS) { if (take(phrase) && !out.audience.has(who)) { out.audience.add(who); out.understood.push(AUDIENCE_LABEL[who]); } }
    // Diagnoses: grants rarely limit by diagnosis, so these show every grant instead of nothing.
    for (const phrase of ["diminished ovarian reserve", "unexplained infertility", "recurrent pregnancy loss", "recurrent miscarriage", "secondary infertility", "male factor infertility", "male factor", "blocked tubes",
      "low amh", "failed ivf", "endometriosis", "miscarriages", "miscarriage", "pcos", "dor", "poi", "endo"]) {
      if (take(phrase) && !out.condition) { out.condition = phrase; out.understood.push("Any diagnosis"); }
    }
    if (take("open now") || take("open right now") || take("accepting applications")) { out.openNow = true; out.understood.push("Open now"); }
    if (take("no application fee") || take("no fee") || take("no fees")) { out.noFee = true; out.understood.push("No application fee"); }
    out.rest = text.split(" ").filter((w) => w && !FILLER.has(w)).join(" ");
    return out;
  }
  const AUDIENCE_LABEL = { lgbtq: "Open to LGBTQ+ families", single: "Open to single applicants", cancer: "For people with cancer", military: "For veterans and service members" };
  const welcomes = (o, who) => ((o.requirements && o.requirements.welcomes) || []).includes(who);

  function matches(c, opts) {
    const o = c.org;
    const st = GROUP_OF[cycleStatus(c)];
    if (!opts.ignoreStatus && !opts.statuses.has(st)) return false;
    if (opts.openNow && !(st === "open" || st === "rolling")) return false;
    if (opts.audience && (opts.audience.has("single") || opts.audience.has("lgbtq")) && o.requirements && o.requirements.married === true) return false;
    if (opts.audience && opts.audience.has("cancer") && !welcomes(o, "cancer")) return false;
    if (opts.audience && opts.audience.has("military") && !welcomes(o, "military")) return false;
    if (opts.q) {
      const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((t) => termMatch(c, t))) return false;
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
    if (opts.state && !(o.geography && ((o.geography.states || []).includes(opts.state) || o.geography.type === "us_national" || o.geography.type === "unknown"))) return false;
    if (opts.clinic && clinicKind(o) !== opts.clinic) return false;
    if (opts.treat && !treatMatch(o, opts.treat)) return false;
    if (opts.fee && feeKind(o) !== opts.fee) return false;
    if (opts.noFee && feeKind(o) !== "none") return false;
    if (opts.fav && !isFav(o.id)) return false;
    if (!opts.ignoreReq && reqConflicts(c, opts.me).length) return false;
    return true;
  }

  function treatMatch(o, t) {
    const list = o.treatments_covered || [];
    return list.includes(t) || (["IVF", "IUI", "FET"].includes(t) && list.includes("General fertility treatment"));
  }

  function currentOpts() {
    const parsed = parseQuery(F.q.value);
    return {
      q: parsed.rest,
      parsed,
      statuses: new Set(STATUS_BOXES.filter((b) => b.checked).map((b) => b.value)),
      year: F.year.value, month: F.month.value, conf: F.conf.value, geo: F.geo.value,
      state: F.state.value || parsed.state,
      clinic: F.clinic.value, treat: F.treat.value || parsed.treat, fee: F.fee.value, fav: F.fav.checked,
      audience: parsed.audience, openNow: parsed.openNow, noFee: parsed.noFee,
      me: readMe()
    };
  }

  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return t.getUTCFullYear() + "-" + pad(t.getUTCMonth() + 1) + "-" + pad(t.getUTCDate());
  }
  // Earliest decision for a round: the published date if there is one, otherwise an estimate from the
  // organization's published timing ("about 4 to 6 weeks after the deadline"). Estimates are labeled as such.
  function estDecision(c) {
    const st = cycleStatus(c);
    if (GROUP_OF[st] === "archive" && st !== "pending") return null;
    if (c.notification_date && c.notification_date.date && dLatest(c.notification_date) >= TODAY) return { date: dLatest(c.notification_date), kind: "published" };
    const ds = c.org.decision_speed;
    if (!ds) return null;
    if (c.kind === "event" && c.event_date && c.event_date.date) return { date: c.event_date.date, kind: "published" };
    if (ds.basis === "after_applying" && (st === "open" || st === "rolling")) return { date: addDays(TODAY, ds.days_max), kind: "estimate" };
    if (ds.basis === "after_deadline" && c.submission_deadline_at && dLatest(c.submission_deadline_at) >= TODAY) return { date: addDays(dLatest(c.submission_deadline_at), ds.days_max), kind: "estimate" };
    return null;
  }

  function sortCycles(list, how) {
    const byName = (a, b) => a.org.name.localeCompare(b.org.name) || String(a.cycle_label).localeCompare(String(b.cycle_label));
    if (how === "name") return list.sort(byName);
    if (how === "fast") return list.sort((a, b) => {
      const ea = estDecision(a), eb = estDecision(b);
      if (ea && eb) return ea.date.localeCompare(eb.date) || byName(a, b);
      return (ea ? -1 : eb ? 1 : 0) || byName(a, b);
    });
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

  function favButton(o) {
    const on = isFav(o.id);
    return `<button type="button" class="btn fav-btn" data-fav="${esc(o.id)}" aria-pressed="${on}" aria-label="${esc("Save " + o.name)}"><span aria-hidden="true">${on ? "★" : "☆"}</span> ${on ? "Saved" : "Save"}</button>`;
  }
  function shareUrl(o) {
    const base = (DATA.meta.site_url || "").replace(/\/?$/, "/");
    return o.pending ? base + "#grant-" + o.id : base + "grants/" + o.id + "/";
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
    const ds = c.org.decision_speed;
    if (ds && c.kind !== "awaiting" && c.kind !== "paused" && GROUP_OF[cycleStatus(c)] !== "archive") rows.push(["How fast", longText(ds.text)]);
    return `<dl class="ledger">${rows.map(([k, v, key]) => `<dt${key ? ' class="key"' : ""}>${esc(k)}</dt><dd${key ? ' class="key"' : ""}>${v}</dd>`).join("")}</dl>`;
  }

  // Plain location tag: "Nationwide", "Only in Texas", "Only in 10 states (including New York)".
  let viewState = "";
  function locTag(o) {
    const g = o.geography || {};
    if (g.type === "us_national") return "Nationwide";
    if (g.type === "international") return geoShort(o);
    if (g.type === "us_regional" && (g.states || []).length) {
      const n = g.states.length;
      if (n <= 3) return "Only in " + g.states.map((x) => STATE_NAMES[x] || x).join(", ");
      return `Only in ${n} states` + (viewState && g.states.includes(viewState) ? ` (including ${STATE_NAMES[viewState]})` : "");
    }
    if (g.type === "us_regional") return "Certain areas only";
    // Area not published, but we know where they're based (for example, "local couples" in North Dakota).
    if ((g.states || []).length) return "Area not stated · based in " + g.states.map((x) => STATE_NAMES[x] || x).join(", ");
    return "Location not stated";
  }

  function card(c) {
    const o = c.org;
    const st = cycleStatus(c);
    const tl = trackLabel(c.id);
    const statusExtra = st === "pending" && c.notification_date ? `<p class="note">Closed. Decisions expected by ${esc(fmtDate(dLatest(c.notification_date)))}.</p>` : (st === "check" ? `<p class="note">The announced opening has passed and no deadline is listed yet. Check the official source.</p>` : "");
    const review = o.pending ? `<p class="note-box"><strong>Pending your review.</strong> ${esc(o.review && o.review.why || "")} Not shown on the public site.</p>` : "";
    const fee = o.application_fee === 0 ? "No fee" : (o.application_fee == null ? "Fee not announced" : feeText(o) + " fee");
    const award = awardText(o) === "Not announced" ? "Award not announced" : awardText(o);
    const g = o.geography || {};
    const loc = `<span class="meta-tag loc-tag loc-${g.type === "us_national" ? "national" : g.type === "us_regional" ? "local" : "other"}"${g.type === "us_regional" && (g.states || []).length > 3 ? ` title="${esc(geoShort(o))}"` : ""}>${esc(locTag(o))}</span>`;
    const tags = [award, fee];
    if (clinicKind(o) === "yes") tags.push("Partner clinic required");
    if (welcomes(o, "lgbtq")) tags.push("Welcomes LGBTQ+ families");
    if (welcomes(o, "single")) tags.push("Open to single applicants");
    const only = o.requirements && o.requirements.only;
    if (only === "cancer") tags.push("People with cancer only");
    else if (welcomes(o, "cancer")) tags.push("For people with cancer");
    if (only === "military") tags.push("Veterans only");
    else if (welcomes(o, "military")) tags.push("For veterans");
    const est = F.sort.value === "fast" ? estDecision(c) : null;
    const fastLine = F.sort.value === "fast" ? `<p class="fast-line">${est ? `<strong>Earliest decision:</strong> ${est.kind === "published" ? "" : "around "}${esc(fmtDate(est.date))} <span class="muted">(${est.kind === "published" ? "published date" : "estimate from their published timing"})</span>` : "Decision timing not published. Contact them to ask."}</p>` : "";
    return `<article class="card${o.pending ? " is-pending" : ""}" data-cycle="${esc(c.id)}">
      <div class="card-top">${pill(st)}${o.pending ? '<span class="pill review">Pending review</span>' : ""}<span class="cycle-tag">${esc(c.cycle_label)}</span></div>
      <div class="card-title">
        <h4><button type="button" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}">${esc(o.name)}</button></h4>
        <p class="card-sub">${esc(o.program_name)}</p>
      </div>
      ${review}
      ${fastLine}
      ${cardLedger(c)}
      ${statusExtra}
      <div class="card-meta">${loc}${tags.map((t) => `<span class="meta-tag">${esc(t)}</span>`).join("")}</div>
      <p class="req-line">${reqShort(reqOf(c)).length ? `<strong>Requires:</strong> ${esc(reqShort(reqOf(c)).join(", "))}` : "Requirements not fully published. Check their website."}</p>
      <div class="card-foot">
        <div class="card-actions">
          ${favButton(o)}
          <button type="button" class="btn" data-track-open="${esc(c.id)}" aria-label="${esc((tl ? "Tracking " + tl + ": " : "Track an application for ") + o.name + ", " + c.cycle_label)}">${tl ? "Tracking: " + esc(tl) : "Track"}</button>
          <button type="button" class="btn btn-primary btn-more" data-open="${esc(o.id)}" data-cycle-focus="${esc(c.id)}" aria-label="${esc("Details for " + o.name + ", " + c.cycle_label)}">Details</button>
        </div>
        <p class="src-line"><button type="button" class="btn-link share-btn" data-share="${esc(o.id)}" aria-label="${esc("Share " + o.name)}">Share</button> · <a href="${esc(moreLink(o).url)}" target="_blank" rel="noopener">More on their website</a> · <a href="${esc(c.source_url || o.official_url)}" target="_blank" rel="noopener">Source for these dates</a> · ${esc(verifiedText(o))}</p>
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
      <thead><tr><th>Organization</th><th>Round</th><th>Status</th><th>Opens</th><th>Deadline or event</th><th>Decisions</th><th>Award</th><th>Fee</th><th>Where</th><th>Source</th></tr></thead>
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
    viewState = opts.state || "";
    const list = sortCycles(CYCLES.filter((c) => matches(c, opts)), F.sort.value);
    const hiddenByReq = opts.me.active ? CYCLES.filter((c) => matches(c, { ...opts, ignoreReq: true }) && reqConflicts(c, opts.me).length) : [];
    const hiddenOrgs = new Set(hiddenByReq.map((c) => c.org.id)).size;
    $("#req-status").textContent = opts.me.active ? (hiddenByReq.length ? `Hiding ${hiddenOrgs} ${hiddenOrgs === 1 ? "grant that lists" : "grants that list"} a requirement you don't meet` : "No grants hidden by your answers") : "";
    const orgCount = new Set(list.map((c) => c.org.id)).size;
    $("#result-count").innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? "application round" : "application rounds"} from <strong>${orgCount}</strong> ${orgCount === 1 ? "organization" : "organizations"}`;
    const moreActive = [F.conf, F.geo, F.clinic, F.fee].filter((s) => s.value).length;
    $("#more-count").textContent = moreActive ? `(${moreActive} on)` : "";
    const statusDefault = STATUS_BOXES.every((b) => b.checked === (b.value !== "archive"));
    const allActive = [F.year, F.month, F.conf, F.geo, F.clinic, F.treat, F.fee].filter((s) => s.value).length + (F.fav.checked ? 1 : 0) + (statusDefault ? 0 : 1);
    $("#filters-on").textContent = allActive ? `(${allActive} on)` : "";
    syncQuick();
    syncEditorial();
    const out = $("#results");
    const p = opts.parsed;
    const searchNote = p.understood.length
      ? `<p class="search-note"><span>Searching for: ${p.understood.map((u) => `<span class="meta-tag">${esc(u)}</span>`).join(" ")}${p.rest ? ` <span class="meta-tag">“${esc(p.rest)}”</span>` : ""}</span>${(p.audience.has("single") || p.audience.has("lgbtq")) ? `<span class="note">Showing grants that don't require marriage. Grants marked “Welcomes…” or “Open to…” say so on their own website.</span>` : ""}${p.audience.has("cancer") ? `<span class="note">Showing programs that say they serve people with cancer, including fertility preservation before treatment. Tap “Need help fast” to see who decides soonest.</span>` : ""}${p.audience.has("military") ? `<span class="note">Showing programs that say they serve veterans or service members.</span>` : ""}${p.condition ? `<span class="note">Grants rarely limit by diagnosis, so we're showing every grant. Some require a doctor's infertility diagnosis; check each grant's requirements.</span>` : ""}${p.spanish ? `<span class="note" lang="es">Entendimos tu búsqueda en español. Por ahora, el sitio está en inglés.</span>` : ""}</p>`
      : "";
    if (!list.length) {
      const tips = [];
      if (p.rest) tips.push(`<button type="button" class="btn" data-search-drop>Search without “${esc(p.rest)}”</button>`);
      if (F.q.value.trim()) tips.push(`<button type="button" class="btn" data-search-clear>Clear the search</button>`);
      tips.push(`<button type="button" class="btn" data-quick="default">Show all current grants</button>`);
      const gap = p.audience.has("military") ? "No grants on this site are specifically for veterans yet. Enrolled veterans can also ask the VA about infertility services. "
        : p.audience.has("cancer") ? "No grants on this site match that for people with cancer yet. "
        : "";
      out.innerHTML = searchNote + `<div class="empty"><p><strong>No grants match yet.</strong> ${gap}${p.rest ? `We couldn't find “${esc(p.rest)}” in any grant. ` : ""}Try one of these:</p><p class="dlg-actions">${tips.join(" ")}</p><p class="note">You can also pick your state and what you're exploring in the filters, or check "Past rounds".</p></div>`;
      return;
    }
    const st = opts.state;
    const stName = st ? STATE_NAMES[st] : "";
    const stateNote = st ? `<p class="state-note"><span>Showing grants you can apply for from <strong>${esc(stName)}</strong>. Where an organization is based doesn't matter.</span> <span class="state-note-actions">${F.state.value ? `<button type="button" class="btn-link" data-state-change>Change</button> <button type="button" class="btn-link" data-state-clear>Show all states</button> ` : ""}<a href="states/${CORE.slug(stName)}/">${esc(stName)} grants page</a></span></p>` : "";
    const reqNote = searchNote + stateNote + (hiddenByReq.length ? `<p class="hidden-note">${hiddenOrgs} ${hiddenOrgs === 1 ? "grant is" : "grants are"} hidden because ${hiddenOrgs === 1 ? "its" : "their"} published rules don't fit your answers: ${esc([...new Set(hiddenByReq.map((c) => c.org.name))].join(", "))}. <button type="button" class="btn-link" data-req-clear>Show all grants again</button></p>` : "");
    if (layout === "table") { out.innerHTML = reqNote + tableHTML(list); return; }
    // "Need help fast": one list, soonest decision first, so the order isn't split by status.
    if (F.sort.value === "fast") {
      out.innerHTML = reqNote + `<section class="group" aria-label="Soonest decisions">
        <div class="group-head"><h3>Soonest decisions first</h3><p>Open and year-round programs, ordered by the earliest date you could hear back. Most dates are estimates from each organization's published timing, not promises. If you're facing a medical deadline, call the organization to confirm.</p></div>
        <div class="cards">${list.map(card).join("")}</div>
      </section>`;
      return;
    }
    const groupsHTML = (rows, h) => GROUPS.map((g) => {
      const items = rows.filter((c) => GROUP_OF[cycleStatus(c)] === g.key);
      if (!items.length) return "";
      return `<section class="group" aria-label="${esc(g.title)}">
        <div class="group-head"><${h}>${esc(g.title)}</${h}><p>${esc(g.help)}</p></div>
        <div class="cards">${items.map(card).join("")}</div>
      </section>`;
    }).join("");
    if (!st) { out.innerHTML = reqNote + groupsHTML(list, "h3"); return; }
    // With a state set: grants limited to that state first, then nationwide, then "location not stated".
    const where = (c) => { const g = c.org.geography || {}; return g.type === "us_national" ? "national" : (g.type === "us_regional" || g.type === "unknown") && (g.states || []).includes(st) ? "local" : "other"; };
    const LOC = [
      { key: "local", title: `Local to ${stName}`, help: `Grants limited to areas that include ${stName}, plus local groups based here. Check each card's tag for the exact area.`,
        none: `No local grants for ${stName} match right now. The nationwide grants below are open to you.` },
      { key: "national", title: "Open to anyone in the U.S.", help: "Nationwide grants. You can apply from any state, wherever the organization is based." },
      { key: "other", title: "Location not stated", help: "These grants don't say where applicants must live. Some are small local groups. Check their website before applying." }
    ];
    out.innerHTML = reqNote + LOC.map((l) => {
      const rows = list.filter((c) => where(c) === l.key);
      if (!rows.length && !l.none) return "";
      const orgs = new Set(rows.map((c) => c.org.id)).size;
      return `<section class="loc-group loc-${l.key}" aria-labelledby="loc-${l.key}">
        <div class="loc-head"><h3 id="loc-${l.key}">${esc(l.title)} <span class="loc-count">${orgs} ${orgs === 1 ? "grant" : "grants"}</span></h3><p>${esc(rows.length ? l.help : l.none)}</p></div>
        ${groupsHTML(rows, "h4")}
      </section>`;
    }).join("");
  }

  // ---------- Shortcuts ----------
  const QUICK = {
    default: { statuses: ["open", "upcoming", "rolling", "tba"] },
    fast: { statuses: ["open", "rolling"], sort: "fast" },
    open: { statuses: ["open", "rolling"] },
    upcoming: { statuses: ["upcoming"] },
    saved: { statuses: ["open", "upcoming", "rolling", "tba", "archive"], fav: true },
    archive: { statuses: ["archive"] }
  };
  // "Where you live" is a setting, not a filter: shortcuts keep it, and this browser remembers it.
  function setState(code) {
    F.state.value = STATE_NAMES[code] ? code : "";
    store.prefs.state = F.state.value;
    save();
  }
  function applyQuick(key) {
    const q = QUICK[key];
    if (!q) return;
    [F.year, F.month, F.conf, F.geo, F.clinic, F.treat, F.fee].forEach((sel) => { sel.value = ""; });
    STATUS_BOXES.forEach((b) => { b.checked = q.statuses.includes(b.value); });
    F.geo.value = q.geo || "";
    F.fav.checked = !!q.fav;
    if (q.sort) F.sort.value = q.sort;
    else if (F.sort.value === "fast") F.sort.value = "deadline";
    renderFind();
  }
  function syncQuick() {
    const statuses = STATUS_BOXES.filter((b) => b.checked).map((b) => b.value).sort().join(",");
    const others = [F.year, F.month, F.conf, F.clinic, F.treat, F.fee].some((sel) => sel.value);
    let active = null;
    if (!others) {
      Object.entries(QUICK).forEach(([k, q]) => {
        if (active) return;
        if (q.statuses.slice().sort().join(",") === statuses && (q.geo || "") === F.geo.value && !!q.fav === F.fav.checked && (q.sort ? F.sort.value === q.sort : F.sort.value !== "fast")) active = k;
      });
    }
    $$(".quick button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.quick === active)));
  }

  // ---------- Editorial home page (index-editorial.html) ----------
  function setupEditorial() {
    const form = $("#ed-form");
    if (!form) return;
    const edState = $("#ed-state"), edPath = $("#ed-path");
    edState.innerHTML = F.state.innerHTML.replace("Any state", "All states");
    const pubOrgs = ORGS.filter((o) => !o.pending);
    $$("[data-path-count]").forEach((el) => {
      const n = pubOrgs.filter((o) => treatMatch(o, el.dataset.pathCount)).length;
      el.textContent = n ? `${n} ${n === 1 ? "grant" : "grants"} to explore` : "Browse this path";
    });
    const go = (state, treat) => {
      applyQuick("default");
      setState(state);
      F.treat.value = treat || "";
      renderFind();
      focusResults();
    };
    form.addEventListener("submit", (ev) => { ev.preventDefault(); go(edState.value, edPath.value); });
    edState.addEventListener("change", () => { setState(edState.value); renderFind(); });
    $$(".ed-card").forEach((card) => card.addEventListener("click", () => {
      edPath.value = card.dataset.path;
      go(edState.value, card.dataset.path);
    }));
  }
  // "Change" next to "Showing grants you can apply for from ...": go to the state picker.
  function changeState() {
    let sel = $("#ed-state");
    if (!sel || !sel.getClientRects().length) {
      sel = F.state;
      if (!sel.getClientRects().length && $("#filters-toggle")) $("#filters-toggle").click();
    }
    sel.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    sel.focus({ preventScroll: true });
  }
  // Scroll to the results and move keyboard focus there (announced by screen readers).
  function focusResults() {
    const target = $("#ed-all") || $("#results");
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    const h = $("#ed-all h2") || $("#result-count");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function syncEditorial() {
    const edState = $("#ed-state"), edPath = $("#ed-path");
    if (!edState) return;
    edState.value = F.state.value;
    edPath.value = [...edPath.options].some((o) => o.value === F.treat.value) ? F.treat.value : "";
  }

  // ---------- Logos (shown only if the image files exist) ----------
  function loadLogos() {
    const big = new Image();
    big.onload = () => { $("#brand-logo").src = big.src; $("#logo-badge").hidden = false; };
    big.src = "assets/logo.png";
    const small = new Image();
    small.onload = () => { const f = $("#foot-logo"); f.src = small.src; f.hidden = false; };
    small.src = "assets/logo-road.png";
    // Photo of Sara and Brady on the About page (shown only once assets/about-photo.jpg exists).
    if ($("#about-photo")) {
      const photo = new Image();
      photo.onload = () => { $("#about-photo").src = photo.src; $("#about-photo-wrap").hidden = false; };
      photo.src = "assets/about-photo.jpg";
    }
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
        ${favButton(o)}
        <button type="button" class="btn" data-share="${esc(o.id)}">Share this grant</button>
        ${o.pending ? "" : `<a class="btn" href="grants/${esc(o.id)}/">Open this grant's page</a>`}
      </div>
      <div class="facts">
        <div><span>Award</span><span>${esc(o.award_text || awardText(o))}</span></div>
        <div><span>Application fee</span><span>${esc(o.fee_text || feeText(o))}</span></div>
        <div><span>Where</span><span>${esc(o.geography && o.geography.text || "Not stated")}</span></div>
        <div><span>Clinic</span><span>${esc(o.clinic_restrictions || clinicShort(o))}</span></div>
        <div><span>Treatments mentioned</span><span>${esc((o.treatments_covered || []).map(CORE.treatLabel).join(", ") || "Not yet verified")}</span></div>
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
    if (openTracker) {
      const trackable = cycles.filter((c) => c.kind !== "awaiting" && c.kind !== "paused");
      if (trackable.length > 1) { showRoundPicker(trackable); return; }
      const only = trackable[0] && document.getElementById("cb-" + trackable[0].id);
      openTrackerIn(only || target);
      return;
    }
    if (target && focusCycleId !== cycles[0].id) target.scrollIntoView({ block: "start" });
    else $(".dialog-inner", detail).scrollTop = 0;
    if (location.hash !== "#grant-" + orgId) history.replaceState(null, "", "#grant-" + orgId);
  }

  function openTrackerIn(block) {
    if (!block) return;
    const d = $("details.tracker-form", block);
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ block: "start" });
    const sel = $("select", d);
    if (sel) sel.focus();
  }
  function showRoundPicker(trackable) {
    const box = document.createElement("section");
    box.className = "round-picker";
    box.setAttribute("aria-label", "Choose a round to track");
    box.innerHTML = `<p><strong>Which round are you tracking?</strong> Pick the one you applied to, or plan to apply to.</p>
      <div class="round-options">${trackable.map((c) => {
        const st = cycleStatus(c);
        const dec = knownDecision(c);
        const extra = st === "pending" && dec ? ` · decisions by ${fmtDate(dec)}` : (c.submission_deadline_at && GROUP_OF[st] !== "archive" ? ` · deadline ${fmtDate(dEarliest(c.submission_deadline_at))}` : "");
        return `<button type="button" class="btn" data-pick-round="${esc(c.id)}"><span>${esc(c.cycle_label)}</span> <span class="muted">${esc(STATUS_LABEL[st])}${esc(extra)}</span></button>`;
      }).join("")}</div>`;
    const head = $(".dialog-head", detail);
    head.insertAdjacentElement("afterend", box);
    $(".dialog-inner", detail).scrollTop = 0;
    const first = $("button", box);
    if (first) first.focus();
  }
  // The decision date a grant has published for a round, if any (latest date when sources differ).
  function knownDecision(c) {
    const n = c.notification_date;
    if (!n || !n.date) return "";
    return dLatest(n);
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
          ${TRACK_FIELDS.map(([k, l, type]) => {
            const known = k === "expected_decision_date" && !t[k] ? knownDecision(c) : "";
            return `<div class="field"><label for="${id(k)}">${l}</label><input id="${id(k)}" name="${k}" type="${type}" value="${esc(t[k] || known)}">${known ? `<span class="hint">Filled in from the date the grant published.</span>` : ""}</div>`;
          }).join("")}
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

  function compareHTML(orgs) {
    const featured = (o) => {
      const cs = sortCycles(CYCLES.filter((c) => c.org.id === o.id && GROUP_OF[cycleStatus(c)] !== "archive"), "deadline");
      return cs[0] || CYCLES.filter((c) => c.org.id === o.id).slice(-1)[0];
    };
    const cols = orgs.map((o) => ({ o, c: featured(o) }));
    const dateOrNA = (d, c) => (d ? dateValueHTML(d, c, {}) : '<span class="muted">Not announced</span>');
    const rows = [
      ["Status", ({ c }) => `${pill(cycleStatus(c))} <span class="muted">${esc(c.cycle_label)}</span>`],
      ["Deadline", ({ c }) => (c.kind === "rolling" ? "Accepted year-round" : dateOrNA(c.submission_deadline_at, c))],
      ["Decision expected", ({ c }) => { const e = estDecision(c); return e ? `${esc(fmtDate(e.date))} <span class="muted">(${e.kind === "published" ? "published" : "estimate"})</span>` : '<span class="muted">Not published</span>'; }],
      ["How fast they decide", ({ o }) => (o.decision_speed ? esc(o.decision_speed.text) : '<span class="muted">Not published</span>')],
      ["Award", ({ o }) => esc(awardText(o))],
      ["Application fee", ({ o }) => esc(feeText(o))],
      ["Where", ({ o }) => esc(geoShort(o))],
      ["Clinic", ({ o }) => esc(clinicShort(o))],
      ["Requires", ({ c }) => { const r = reqShort(reqOf(c)); return r.length ? esc(r.join(", ")) : '<span class="muted">Not fully published</span>'; }],
      ["Welcomes", ({ o }) => { const w = ((o.requirements && o.requirements.welcomes) || []).map((x) => AUDIENCE_LABEL[x]); return w.length ? esc(w.join(", ")) : '<span class="muted">Not stated</span>'; }],
      ["More details", ({ o }) => `<a href="${esc(moreLink(o).url)}" target="_blank" rel="noopener">Their website</a>`]
    ];
    return `<h3 style="margin-top:24px">Compare your saved grants</h3>
      <p class="note">Side by side, using each grant's next or current round. Scroll sideways on a phone.</p>
      <div class="table-wrap"><table class="compare"><thead><tr><th scope="col">What to compare</th>${cols.map(({ o }) => `<th scope="col"><button type="button" class="t-name" data-open="${esc(o.id)}">${esc(o.name)}</button></th>`).join("")}</tr></thead>
      <tbody>${rows.map(([label, fn]) => `<tr><th scope="row">${esc(label)}</th>${cols.map((col) => `<td>${fn(col)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
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
      html += `<h3>Applications</h3><div class="table-wrap"><table><thead><tr><th>Grant</th><th>Round</th><th>My status</th><th>Deadline</th><th>Submitted</th><th>Expected decision</th><th>Decision</th><th>Award</th><th>Notes</th></tr></thead><tbody>` +
        tracked.sort((a, b) => (a.c ? a.c.org.name : a.cid).localeCompare(b.c ? b.c.org.name : b.cid)).map(({ cid, t, c }) => {
          if (!c) return `<tr><td colspan="9">A tracked application round (${esc(cid)}) is no longer listed. Your notes: ${esc(t.notes || "none")}</td></tr>`;
          const s = TRACK_STATUSES.find((x) => x[0] === t.status);
          return `<tr>
            <td class="t-org"><button type="button" data-open="${esc(c.org.id)}" data-cycle-focus="${esc(c.id)}">${esc(c.org.name)}</button></td>
            <td>${esc(c.cycle_label)}</td><td>${esc(s ? s[1] : "Not set")}</td>
            <td>${c.submission_deadline_at ? dateValueHTML(c.submission_deadline_at, c, {}) : '<span class="muted">Not announced</span>'}</td>
            <td>${esc(t.submitted_date ? fmtDate(t.submitted_date) : "")}</td>
            <td>${t.expected_decision_date ? esc(fmtDate(t.expected_decision_date)) : (knownDecision(c) ? `${esc(fmtDate(knownDecision(c)))} <span class="muted">(published)</span>` : "")}</td>
            <td>${esc(t.actual_decision_date ? fmtDate(t.actual_decision_date) : "")}</td>
            <td>${esc(t.award_amount || "")}</td>
            <td>${esc(t.notes || "")}</td></tr>`;
        }).join("") + `</tbody></table></div>`;
    }
    if (favOrgs.length >= 2) html += compareHTML(favOrgs);
    else if (favOrgs.length === 1) html += `<p class="note" style="margin-top:16px">Save one more grant to compare them side by side.</p>`;
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
    const head = ["organization", "program", "round", "round_year", "status", "application_opens", "start_application_by", "submission_deadline", "deadline_basis", "event_date", "notification", "notification_window", "funds_available", "treatment_start_rule", "expiration_rule", "date_confidence", "award", "application_fee", "geography", "clinic_rule", "treatments", "official_source", "last_checked"];
    const rows = list.map((c) => {
      const o = c.org;
      return [o.name, o.program_name, c.cycle_label, c.cycle_year, STATUS_LABEL[cycleStatus(c)], dateCSV(c.application_opens_at), dateCSV(c.start_application_deadline_at), dateCSV(c.submission_deadline_at), c.deadline_basis, dateCSV(c.event_date),
        dateCSV(c.notification_date), c.notification_window_text, dateCSV(c.funds_available_date) || c.funds_available_text, c.treatment_start_rule, c.expiration_rule, CONF_LABEL[c.date_confidence] || c.date_confidence,
        o.award_text || awardText(o), o.fee_text || feeText(o), o.geography && o.geography.text, o.clinic_restrictions || clinicShort(o), (o.treatments_covered || []).join("; "), c.source_url || o.official_url, o.last_verified_at || "not verified"];
    });
    return [head].concat(rows).map((r) => r.map(csvCell).join(",")).join("\r\n");
  }
  function trackerCSV() {
    const head = ["organization", "round", "my_status", "submitted_date", "confirmation_date", "expected_decision_date", "actual_decision_date", "award_amount", "funds_received_date", "notes", "checklist_done", "last_updated"];
    const rows = Object.entries(store.tracking).map(([cid, t]) => {
      const c = CYCLE_BY_ID[cid];
      const s = TRACK_STATUSES.find((x) => x[0] === t.status);
      return [c ? c.org.name : cid, c ? c.cycle_label : "", s ? s[1] : "", t.submitted_date, t.confirmation_date, t.expected_decision_date || (c ? knownDecision(c) : ""), t.actual_decision_date, t.award_amount, t.funds_received_date, t.notes,
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
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Family-Building Grant Finder//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Family-building grant dates"];
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
    if ($("#about-listen")) $("#about-listen").innerHTML = `Listen to our story on ${links}.`;
    const upd = "Grant information last updated " + fmtDate(m.data_updated) + ".";
    $("#foot-updated").textContent = upd;
    $("#about-updated").textContent = upd + " Research first compiled " + fmtDate(m.research_compiled) + ".";
    if (m.suggestion_form_url) {
      ["#suggest-link", "#foot-suggest-link"].forEach((s) => { $(s).href = m.suggestion_form_url; });
      $("#suggest-wrap").hidden = false;
      $("#foot-suggest").hidden = false;
    }
    $("#legend").innerHTML = Object.keys(CONF_LABEL).map((k) => `<dt>${chip(k)}</dt><dd>${esc(CONF_HELP[k])}</dd>`).join("");
    const resItem = (r) => `<article class="res-item">
      <h4><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></h4>
      <p class="muted">${esc(r.type)} · ${esc(r.last_verified_at ? "Checked " + fmtDate(r.last_verified_at) : "Not rechecked")}</p>
      <p>${esc(r.description)}</p>${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}</article>`;
    // Grouped under short headings, in the order the groups first appear in the data.
    const resGroups = [];
    (DATA.resources || []).forEach((r) => { const g = r.group || "More resources"; if (!resGroups.includes(g)) resGroups.push(g); });
    $("#resources-list").innerHTML = resGroups.map((g) => `<section class="res-group" aria-label="${esc(g)}"><h3>${esc(g)}</h3>
      ${(DATA.resources || []).filter((r) => (r.group || "More resources") === g).map(resItem).join("")}</section>`).join("");
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
      if (STATE_NAMES[code]) { setState(code); showView("find"); return; }
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

  // Short message at the bottom of the screen (screen readers announce it).
  let toastTimer = null;
  function toast(html) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 9000);
  }
  async function shareGrant(id) {
    const o = ORG_BY_ID[id];
    if (!o) return;
    const url = shareUrl(o);
    const text = `${o.name}: ${o.program_name}. Dates, requirements, and official links on Family-Building Grant Finder.`;
    if (navigator.share) {
      try { await navigator.share({ title: o.name, text, url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(`Link copied. Paste it into a text or email.<br><span class="muted">${esc(url)}</span>`);
    } catch (e) {
      toast(`Copy this link to share it: <input type="text" readonly value="${esc(url)}" aria-label="Link to share" onfocus="this.select()">`);
      const inp = $("#toast input");
      if (inp) { inp.focus(); inp.select(); }
    }
  }

  // Where to put keyboard focus back after the Details window closes.
  let lastOpener = null;

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    // "Check requirements" link under the hero: open the questions next to the results.
    if (t.closest("[data-open-req]")) {
      ev.preventDefault();
      const panel = $("#req-check");
      panel.open = true;
      panel.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      panel.querySelector("summary").focus({ preventScroll: true });
      return;
    }
    const shareBtn = t.closest("[data-share]");
    if (shareBtn) { shareGrant(shareBtn.getAttribute("data-share")); return; }
    const openBtn = t.closest("[data-open]");
    if (openBtn) { if (!detail.open) lastOpener = { org: openBtn.getAttribute("data-open"), attr: "data-open" }; openDetail(openBtn.getAttribute("data-open"), openBtn.getAttribute("data-cycle-focus")); return; }
    const pick = t.closest("[data-pick-round]");
    if (pick) { const box = pick.closest(".round-picker"); openTrackerIn(document.getElementById("cb-" + pick.getAttribute("data-pick-round"))); if (box) box.remove(); return; }
    const trackBtn = t.closest("[data-track-open]");
    if (trackBtn) { const c = CYCLE_BY_ID[trackBtn.getAttribute("data-track-open")]; if (c) { lastOpener = { org: c.org.id, attr: "data-track-open", value: c.id }; openDetail(c.org.id, c.id, true); } return; }
    if (t.closest("[data-req-clear]")) { clearReq(); return; }
    if (t.closest("[data-search-clear]")) { F.q.value = ""; renderFind(); return; }
    if (t.closest("[data-search-drop]")) { const p = parseQuery(F.q.value); F.q.value = p.understood.length ? F.q.value.replace(new RegExp(p.rest.split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi"), "").replace(/\s+/g, " ").trim() : ""; renderFind(); return; }
    if (t.closest("[data-state-change]")) { changeState(); return; }
    if (t.closest("[data-state-clear]")) { setState(""); if (location.hash.startsWith("#state-")) history.replaceState(null, "", "#find"); renderFind(); return; }
    const quickBtn = t.closest("[data-quick]");
    if (quickBtn) {
      applyQuick(quickBtn.dataset.quick);
      if (quickBtn.hasAttribute("data-scroll-results")) focusResults();
      return;
    }
    const fav = t.closest("[data-fav]");
    if (fav) {
      const id = fav.getAttribute("data-fav");
      toggleFav(id);
      $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => { b.outerHTML = favButton(ORG_BY_ID[id]); });
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
    // Put focus back on the button that opened Details, so keyboard and screen-reader users keep their place.
    if (lastOpener) {
      // Only buttons on screen (not inside a closed window or a hidden tab). Prefer the same kind of button.
      const onScreen = (sel) => $$(sel).find((el) => !el.closest("dialog") && el.getClientRects().length);
      const org = CSS.escape(lastOpener.org);
      const target = (lastOpener.attr === "data-track-open" && onScreen(`[data-track-open="${CSS.escape(lastOpener.value)}"]`))
        || onScreen(`.btn-more[data-open="${org}"]`) || onScreen(`[data-open="${org}"]`);
      if (target) target.focus();
      lastOpener = null;
    }
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
  [F.year, F.month, F.conf, F.geo, F.clinic, F.treat, F.fee, F.fav, F.sort].concat(STATUS_BOXES).forEach((el) => el.addEventListener("change", renderFind));
  F.state.addEventListener("change", () => { setState(F.state.value); renderFind(); });
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
    [F.year, F.month, F.conf, F.geo, F.clinic, F.treat, F.fee].forEach((s) => { s.value = ""; });
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
  if (store.prefs.state && STATE_NAMES[store.prefs.state]) F.state.value = store.prefs.state;
  setupEditorial();
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
