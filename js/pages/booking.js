/* Booking request for the trip in the planner: a summary that re-prices
   itself when the start date changes, a form with checks (name, e-mail,
   phone, start date, consent), an error summary that links to each field,
   and a confirmation with a booking code and a calendar file. Nothing is
   paid here: the agency would call back to confirm. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $, icon } = Site;
  const trip = Store.draft();
  const values = { name: "", email: "", phone: "+998 ", date: trip && trip.date ? trip.date : "", room: "double", notes: "", consent: false };
  let tried = false; // show errors live only after the first submit
  let done = null;

  const FIELDS = ["name", "email", "phone", "date", "consent"];
  function errorsOf(v) {
    const e = {};
    const n = Calc.checkName(v.name); if (n) e.name = "book.err.name." + n;
    const m = Calc.checkEmail(v.email); if (m) e.email = "book.err.email." + m;
    const p = Calc.checkPhone(v.phone); if (p) e.phone = "book.err.phone." + p;
    const d = Calc.checkStart(v.date, Site.todayIso()); if (d) e.date = "book.err.date." + d;
    if (!v.consent) e.consent = "book.err.consent";
    return e;
  }

  function summary() {
    const tr = Calc.cleanTrip({ ...trip, date: values.date || trip.date });
    const p = Calc.plan(tr);
    const end = tr.date ? Calc.addDays(tr.date, p.dayCount - 1) : "";
    return el("aside", { class: "book-summary", "aria-labelledby": "sumTitle" },
      el("h2", { id: "sumTitle", text: t("book.summary") }),
      el("p", { class: "tour-route", text: [tr.start, ...tr.stops.map((s) => s.city), tr.ret].filter(Boolean).filter((c, i, a) => c !== a[i - 1]).map(Site.cityName).join(" → ") }),
      el("dl", { class: "fact-list" },
        el("div", null, el("dt", { text: t("book.length") }), el("dd", { text: t("plan.line", { days: p.dayCount, nights: p.nights, count: p.dayCount, time: Site.hours(p.hours) }) })),
        el("div", null, el("dt", { text: t("book.dates") }), el("dd", { text: tr.date ? `${Site.dateText(tr.date)} – ${Site.dateText(end, true)}` : t("book.noDate") })),
        el("div", null, el("dt", { text: t("book.who") }), el("dd", { text: Site.who(tr) })),
        el("div", null, el("dt", { text: t("plan.hotel") }), el("dd", { text: t("hotel." + tr.hotel) })),
        el("div", null, el("dt", { text: t("book.extras") }), el("dd", { text: [tr.guide && t("book.withGuide"), tr.driver && t("book.withDriver")].filter(Boolean).join(", ") || t("book.noExtras") }))),
      el("p", { class: "plan-label", text: t("plan.total") }),
      el("p", { class: "plan-total price", text: Site.money(p.price.total) }),
      el("p", { class: "hint", text: t("book.noPay") }),
      el("a", { href: "planner.html", class: "more-link", text: t("book.change") }));
  }

  function field(id, label, input, hint) {
    const err = tried ? errorsOf(values)[id] : null;
    if (err) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", id + "Err" + (hint ? " " + id + "Hint" : "")); }
    else if (hint) input.setAttribute("aria-describedby", id + "Hint");
    return el("div", { class: "field" }, el("label", { for: id, text: label }), input,
      hint && el("p", { class: "hint", id: id + "Hint", text: hint }),
      el("p", { class: "field-error", id: id + "Err", text: err ? t(err) : "" }));
  }
  const bind = (id) => (e) => { values[id] = e.target.type === "checkbox" ? e.target.checked : e.target.value; if (tried || id === "date") refresh(id); };

  function formView() {
    const errs = tried ? errorsOf(values) : {};
    const list = Object.keys(errs);
    return el("form", { class: "book-form", id: "bookForm", novalidate: true, onsubmit: submit },
      list.length ? el("div", { class: "error-summary", id: "errorSummary", tabindex: "-1", role: "alert" },
        el("h2", { text: t("book.errTitle", { count: list.length }) }),
        el("ul", null, list.map((k) => el("li", null, el("a", { href: "#" + k, text: t(errs[k]) }))))) : "",
      el("h2", { text: t("book.contact") }),
      field("name", t("book.name"), el("input", { id: "name", class: "input", autocomplete: "name", maxlength: 60, value: values.name, oninput: bind("name") })),
      field("email", t("book.email"), el("input", { id: "email", class: "input", type: "email", autocomplete: "email", maxlength: 100, value: values.email, oninput: bind("email") })),
      field("phone", t("book.phone"), el("input", { id: "phone", class: "input", type: "tel", autocomplete: "tel", inputmode: "tel", maxlength: 20, value: values.phone, oninput: bind("phone") }), t("book.phoneHint")),
      el("h2", { text: t("book.tripDetails") }),
      field("date", t("book.date"), el("input", { id: "date", class: "input", type: "date", value: values.date, min: Calc.addDays(Site.todayIso(), 3), max: Calc.addDays(Site.todayIso(), 365), onchange: bind("date") }), t("book.dateHint")),
      el("div", { class: "field" }, el("label", { for: "room", text: t("book.room") }),
        el("select", { id: "room", class: "select", onchange: bind("room") }, ["double", "twin", "single"].map((r) => el("option", { value: r, selected: values.room === r, text: t("room." + r) })))),
      el("div", { class: "field" }, el("label", { for: "notes", text: t("book.notes") }),
        el("textarea", { id: "notes", class: "input", rows: 3, maxlength: 500, oninput: bind("notes") }, values.notes),
        el("p", { class: "hint", text: t("book.notesHint") })),
      (() => {
        const err = tried ? errs.consent : null;
        return el("div", { class: "field" },
          el("label", { class: "check", for: "consent" }, el("input", { id: "consent", type: "checkbox", checked: values.consent, "aria-invalid": err ? "true" : null, "aria-describedby": err ? "consentErr" : null, onchange: bind("consent") }), el("span", { text: t("book.consent") })),
          el("p", { class: "field-error", id: "consentErr", text: err ? t(err) : "" }));
      })(),
      el("button", { type: "submit", class: "btn" }, icon("check", 18), el("span", { text: t("book.send") })));
  }

  // redraw, keeping focus and the caret in the field being typed in
  function refresh(focusId) {
    const a = document.activeElement;
    const pos = a && "selectionStart" in a ? [a.selectionStart, a.selectionEnd] : null;
    render();
    const n = focusId && $(focusId);
    if (n) { n.focus(); if (pos && n.setSelectionRange && n.type !== "email" && n.type !== "date") { try { n.setSelectionRange(pos[0], pos[1]); } catch (e) { /* not a text field */ } } }
  }
  function submit(e) {
    e.preventDefault();
    tried = true;
    const errs = errorsOf(values);
    if (Object.keys(errs).length) { render(); $("errorSummary").focus(); return; }
    const tr = Calc.cleanTrip({ ...trip, date: values.date });
    const p = Calc.plan(tr);
    done = Store.addBooking({ trip: tr, days: p.dayCount, total: p.price.total, name: values.name.trim(), email: values.email.trim(), phone: values.phone.replace(/[\s()-]/g, ""), room: values.room, notes: values.notes.trim().slice(0, 500) });
    render();
    $("doneTitle").focus();
  }

  // +998901234567 → +998 90 123 45 67 (other countries stay as typed, without spaces)
  const phoneText = (p) => (/^\+998\d{9}$/.test(p) ? p.replace(/^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5") : p);
  function doneView(b) {
    const end = Calc.addDays(b.trip.date, b.days - 1);
    return el("section", { class: "book-done", "aria-labelledby": "doneTitle" },
      el("h2", { id: "doneTitle", tabindex: "-1", text: t("book.doneTitle") }),
      el("p", { text: t("book.doneText", { name: b.name, phone: phoneText(b.phone) }) }),
      el("p", { class: "plan-label", text: t("book.code") }),
      el("p", { class: "book-code", text: b.code }),
      el("dl", { class: "fact-list" },
        el("div", null, el("dt", { text: t("book.dates") }), el("dd", { text: `${Site.dateText(b.trip.date)} – ${Site.dateText(end, true)}` })),
        el("div", null, el("dt", { text: t("book.route") }), el("dd", { text: b.trip.stops.map((s) => Site.cityName(s.city)).join(" → ") })),
        el("div", null, el("dt", { text: t("plan.total") }), el("dd", { text: Site.money(b.total) }))),
      el("div", { class: "plan-actions" }, Site.icsLink(b), el("a", { class: "btn btn-ghost btn-small", href: "trips.html#bookings", text: t("book.toTrips") })));
  }

  function render() {
    const view = $("bookView");
    if (done) { view.replaceChildren(doneView(done)); return; }
    if (!trip || !trip.stops.length) {
      view.replaceChildren(el("div", { class: "empty" }, el("h2", { text: t("book.noTrip") }), el("p", { text: t("book.noTripText") }), el("a", { class: "btn", href: "planner.html", text: t("page.planner") })));
      return;
    }
    view.replaceChildren(el("div", { class: "book-layout" }, formView(), summary()));
  }

  Site.start(render, { onChange: () => { if (!document.activeElement || !document.activeElement.closest("#bookForm")) render(); } });
})();
