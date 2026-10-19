/* Grant and state pages: recompute each round's status ("Open now", "Closed", ...) for today's date,
   so a page built weeks ago never shows an out-of-date label. */
(function () {
  "use strict";
  const C = window.FGF_CORE;
  const el = document.getElementById("rounds");
  if (!C || !el) return;
  let rounds = {};
  try { rounds = JSON.parse(el.textContent); } catch (e) { return; }
  const today = C.todayISO();
  document.querySelectorAll("[data-round-id]").forEach((pill) => {
    const c = rounds[pill.getAttribute("data-round-id")];
    if (!c) return;
    const st = C.cycleStatus(c, today);
    pill.className = "pill s-" + st;
    pill.textContent = C.STATUS_LABEL[st];
  });
})();
