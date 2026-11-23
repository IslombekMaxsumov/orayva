/* The trip planner: pick places and nights (or start from a tour), who is
   going, when, hotel class, guide, driver and how to travel. It finds the
   route between the cities (Calc.path), spreads the sights over the days,
   prices everything and warns about long journeys, rushed stays, heat and
   snow. The plan is kept as the draft and in the address, so it can be shared. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $, icon } = Site;
  let trip = Calc.tripFromQuery(location.search) || Store.draft() || Calc.cleanTrip({ stops: [] });

  function set(change, rebuildForm = true) {
    trip = Calc.cleanTrip({ ...trip, ...change });
    Store.setDraft(trip, true);
    history.replaceState(null, "", "?" + Calc.tripToQuery(trip));
    if (rebuildForm) form(); else syncForm();
    result();
  }

  /* ---------- the form ---------- */
  const opts = (list, value) => list.map(([v, text]) => el("option", { value: v, selected: String(v) === String(value), text }));
  function stopRow(s, i) {
    const c = DATA.city(s.city);
    const last = i === trip.stops.length - 1;
    const move = (d) => { const stops = [...trip.stops]; [stops[i], stops[i + d]] = [stops[i + d], stops[i]]; set({ stops }); focusLater(`[data-move="${i + d}${d < 0 ? "u" : "d"}"]`, `[data-move="${i + d}${d < 0 ? "d" : "u"}"]`); };
    return el("li", { class: "stop" },
      el("div", { class: "stop-head" },
        el("span", { class: "stop-num", "aria-hidden": "true", text: String(i + 1) }),
        el("a", { class: "stop-name", href: "destination.html?id=" + c.id, text: c.name[Site.lang()] })),
      Site.stepper({ id: "nights" + i, label: t("plan.nights"), value: s.nights, min: 1, max: 14,
        onChange: (v) => { const back = stepFocus("nights" + i); const stops = trip.stops.map((x, k) => (k === i ? { ...x, nights: v } : x)); set({ stops }); focusLater(back, "#nights" + i); },
        hint: s.nights < c.minNights ? t("plan.minHint", { count: c.minNights }) : null }),
      el("div", { class: "stop-tools" },
        el("button", { type: "button", class: "icon-btn", "data-move": i + "u", disabled: i === 0, "aria-label": t("plan.up", { name: c.name[Site.lang()] }), onclick: () => move(-1) }, icon("up", 18)),
        el("button", { type: "button", class: "icon-btn", "data-move": i + "d", disabled: last, "aria-label": t("plan.down", { name: c.name[Site.lang()] }), onclick: () => move(1) }, icon("down", 18)),
        el("button", { type: "button", class: "icon-btn", "aria-label": t("plan.remove", { name: c.name[Site.lang()] }), onclick: () => {
          const before = trip.stops;
          set({ stops: trip.stops.filter((_, k) => k !== i) });
          Core.toast(t("plan.removed", { name: c.name[Site.lang()] }), { label: t("undo"), onClick: () => set({ stops: before }) });
          focusLater("#addCity");
        } }, icon("trash", 18))));
  }
  function form() {
    const L = Site.lang();
    const lastCity = trip.stops.length ? trip.stops[trip.stops.length - 1].city : null;
    const sec = (n, key) => el("h3", { class: "plan-sec" }, el("span", { class: "plan-sec-n num", "aria-hidden": "true", text: "0" + n }), el("span", { text: t(key) }));
    const fields = [
      sec(1, "plan.sec1"),
      el("div", { class: "field" }, el("label", { for: "tour", text: t("plan.fromTour") }),
        el("select", { id: "tour", class: "select", onchange: (e) => { if (!e.target.value) return; const tr = DATA.tour(e.target.value); set({ ...Calc.tourTrip(tr, { month: trip.month, date: trip.date, adults: trip.adults, children: trip.children }) }); Core.toast(t("plan.tourLoaded", { name: tr.name[L] })); focusLater("#tour"); } },
          opts([["", t("plan.chooseTour")], ...DATA.TOURS.map((tr) => [tr.id, tr.name[L]])], ""))),
      el("fieldset", { class: "stops-field" },
        el("legend", { text: t("plan.stops") }),
        trip.stops.length ? el("ol", { class: "stop-list" }, trip.stops.map(stopRow)) : el("p", { class: "hint", text: t("plan.noStops") }),
        el("div", { class: "add-stop" },
          el("label", { for: "addCity", class: "visually-hidden", text: t("plan.addLabel") }),
          el("select", { id: "addCity", class: "select" }, opts(DATA.CITIES.filter((c) => c.id !== lastCity).map((c) => [c.id, c.name[L]]), "")),
          el("button", { type: "button", class: "btn btn-ghost", id: "addBtn", onclick: () => {
            const id = $("addCity").value;
            set({ stops: [...trip.stops, { city: id, nights: DATA.city(id).minNights }] });
            Core.toast(t("plan.addedStop", { name: Site.cityName(id) }));
            focusLater("#addBtn");
          } }, icon("plus", 18), el("span", { text: t("plan.add") })))),
      sec(2, "plan.sec2"),
      el("div", { class: "field-row" },
        el("div", { class: "field" }, el("label", { for: "start", text: t("plan.start") }),
          el("select", { id: "start", class: "select", onchange: (e) => set({ start: e.target.value }, false) }, opts(DATA.START_CITIES.map((id) => [id, Site.cityName(id)]), trip.start))),
        el("div", { class: "field" }, el("label", { for: "ret", text: t("plan.ret") }),
          el("select", { id: "ret", class: "select", onchange: (e) => set({ ret: e.target.value }, false) }, opts([...DATA.START_CITIES.map((id) => [id, t("plan.retTo", { city: Site.cityName(id) })]), ["", t("plan.retNone")]], trip.ret)))),
      el("div", { class: "field-row" },
        Site.stepper({ id: "adults", label: t("plan.adults"), value: trip.adults, min: 1, max: 10, onChange: (v) => { const back = stepFocus("adults"); set({ adults: v }); focusLater(back, "#adults"); } }),
        Site.stepper({ id: "children", label: t("plan.children"), value: trip.children, min: 0, max: 6, hint: t("plan.childrenHint"), onChange: (v) => { const back = stepFocus("children"); set({ children: v }); focusLater(back, "#children"); } })),
      sec(3, "plan.sec3"),
      el("div", { class: "field-row" },
        el("div", { class: "field" }, el("label", { for: "date", text: t("plan.date") }),
          el("input", { id: "date", type: "date", class: "input", value: trip.date, min: Calc.addDays(Site.todayIso(), 3), max: Calc.addDays(Site.todayIso(), 365), onchange: (e) => set({ date: e.target.value }, false) }),
          el("p", { class: "hint", text: t("plan.dateHint") })),
        el("div", { class: "field" }, el("label", { for: "month", text: t("plan.month") }),
          el("select", { id: "month", class: "select", disabled: !!trip.date, onchange: (e) => set({ month: Number(e.target.value) }, false) }, opts(Array.from({ length: 12 }, (_, i) => [i + 1, Site.monthName(i + 1)]), trip.month)))),
      sec(4, "plan.sec4"),
      Site.choice({ name: "hotel", legend: t("plan.hotel"), value: trip.hotel, options: DATA.CLASSES.map((c) => [c, t("hotel." + c)]), onChange: (v) => set({ hotel: v }, false) }),
      Site.choice({ name: "pref", legend: t("plan.pref"), value: trip.pref, options: ["fastest", "cheapest", "comfort"].map((p) => [p, t("pref." + p)]), onChange: (v) => set({ pref: v }, false) }),
      Site.switchField({ id: "guide", label: t("plan.guide"), checked: trip.guide, hint: t("plan.guideHint"), onChange: (v) => set({ guide: v }, false) }),
      Site.switchField({ id: "driver", label: t("plan.driver"), checked: trip.driver, hint: t("plan.driverHint"), onChange: (v) => set({ driver: v }, false) }),
    ];
    $("planFields").replaceChildren(...fields);
  }
  // fields that keep their element (selects, switches) only need the month box updated
  function syncForm() {
    const m = $("month");
    if (m) { m.disabled = !!trip.date; m.value = String(trip.month); }
  }
  const stepFocus = (id) => (document.activeElement && document.activeElement.dataset.step ? `[data-step="${document.activeElement.dataset.step}"]` : "#" + id);
  // after the form is rebuilt, put focus back on the same control (or a fallback);
  // a disabled button (e.g. + at the maximum) falls through to the next selector
  function focusLater(...selectors) {
    setTimeout(() => {
      for (const s of selectors) { const n = document.querySelector(s); if (n && !n.disabled) { n.focus(); return; } }
    }, 0);
  }

  /* ---------- the result ---------- */
  function warningText(w) {
    const city = w.city ? Site.cityName(w.city) : "";
    switch (w.type) {
      case "longLeg": return t("warn.longLeg", { from: Site.cityName(w.from), to: Site.cityName(w.to), time: Site.hours(w.hours), mode: t("mode." + w.mode) });
      case "rushed": return t("warn.rushed", { city, count: w.min });
      case "missed": return t("warn.missed", { city, count: w.count });
      case "heat": return t("warn.heat", { city, month: Site.monthName(w.month) });
      case "snow": return t(w.city === "chimgan" ? "warn.ski" : "warn.snow", { city, month: Site.monthName(w.month) });
      case "classLimit": return t("warn.classLimit", { city, cls: t("hotel." + w.cls) });
      case "noRoute": return t("warn.noRoute", { from: Site.cityName(w.from), to: Site.cityName(w.to) });
      default: return w.type;
    }
  }
  function result() {
    if (!trip.stops.length) {
      $("planSummary").replaceChildren(el("p", { class: "hint", text: t("plan.emptyResult") }));
      ["planWarnings", "planPrice", "planRoute", "planDays"].forEach((id) => $(id).replaceChildren());
      actions(null);
      return;
    }
    const p = Calc.plan(trip);
    const x = p.price;
    const heads = trip.adults + trip.children;
    $("planSummary").replaceChildren(
      el("p", { class: "plan-label", text: t("plan.total") }),
      el("p", { class: "plan-total price", text: Site.money(x.total) }),
      el("p", { class: "plan-per", text: t("plan.perPerson", { sum: Site.money(x.perPerson), count: heads }) }),
      el("p", { class: "plan-line", text: t("plan.line", { days: p.dayCount, nights: p.nights, count: p.dayCount, time: Site.hours(p.hours) }) }),
      el("p", { class: "hint", text: t("plan.estimate") }));

    const warns = p.warnings;
    $("planWarnings").replaceChildren(warns.length ? el("ul", { class: "warn-list", "aria-label": t("plan.warnings") },
      warns.map((w) => el("li", { class: "warn warn-" + w.type }, icon("alert", 16), el("span", { text: warningText(w) })))) : "");

    const rows = [["hotels", x.hotels], ["transport", x.transport], ["driver", x.driver], ["guide", x.guide], ["fees", x.fees], ["meals", x.meals]].filter(([, v]) => v > 0);
    $("planPrice").replaceChildren(el("section", { "aria-labelledby": "priceTitle", class: "plan-block" },
      el("h3", { id: "priceTitle", text: t("plan.priceTitle") }),
      el("dl", { class: "price-rows" },
        rows.map(([k, v]) => el("div", null, el("dt", { text: t("price." + k) }), el("dd", { text: Site.money(v) }))),
        x.discount ? el("div", { class: "is-discount" }, el("dt", { text: t("price.discount", { pct: Math.round(x.discountRate * 100) }) }), el("dd", { text: "−" + Site.money(x.discount) })) : "",
        el("div", { class: "is-total" }, el("dt", { text: t("price.total") }), el("dd", { text: Site.money(x.total) })))));

    $("planRoute").replaceChildren(p.legs.length ? el("section", { "aria-labelledby": "routeTitle", class: "plan-block" },
      el("h3", { id: "routeTitle", text: t("plan.routeTitle") }),
      el("ol", { class: "leg-list" }, p.legs.map((l) => el("li", { class: "leg" },
        icon(Site.modeIcon[l.mode], 18),
        el("span", { class: "leg-cities", text: `${Site.cityName(l.from)} → ${Site.cityName(l.to)}` }),
        el("span", { class: "leg-meta", text: `${t("mode." + l.mode)} · ${Site.hours(l.hours)}${l.km ? " · " + t("unit.km", { n: Site.num(l.km) }) : ""}` }),
        el("span", { class: "leg-price", text: l.price ? Site.money(l.price) : t("plan.inDriver") }))))) : "");

    $("planDays").replaceChildren(el("section", { "aria-labelledby": "daysTitle", class: "plan-block" },
      el("h3", { id: "daysTitle", text: t("plan.daysTitle") }),
      el("ol", { class: "day-list" }, p.days.map((d) => {
        const c = DATA.city(d.city);
        const date = trip.date ? Site.dateText(Calc.addDays(trip.date, d.n - 1)) : "";
        return el("li", { class: "day" + (d.last ? " is-last" : "") },
          el("h4", null, el("span", { class: "day-n", text: t("plan.day", { n: d.n }) }), date ? el("span", { class: "day-date", text: " · " + date }) : "", " ", el("span", { class: "day-city", text: c.name[Site.lang()] })),
          d.travel ? el("p", { class: "day-travel" }, d.travel.legs.map((l, i) => [i ? " → " : "", icon(Site.modeIcon[l.mode], 16), " ", t("plan.travelTo", { to: Site.cityName(l.to), mode: t("mode." + l.mode), time: Site.hours(l.hours) })])) : "",
          d.sights.length ? el("ul", { class: "day-sights" }, d.sights.map((id) => el("li", { text: c.sights.find((s) => s.id === id).name[Site.lang()] }))) : el("p", { class: "hint", text: d.travel ? t("plan.travelDay") : t("plan.freeTime") }),
          el("p", { class: "day-night", text: d.night ? t("plan.night", { city: Site.cityName(d.night) }) : t("plan.goHome") }));
      }))));
    actions(p);
  }

  function actions(p) {
    const box = $("planActions");
    if (!p) { box.replaceChildren(); return; }
    const name = el("input", { id: "planName", class: "input", maxlength: 60, value: t("plan.defaultName", { route: trip.stops.map((s) => Site.cityName(s.city)).slice(0, 3).join(", ") }) });
    box.replaceChildren(
      el("a", { class: "btn", href: "booking.html" }, icon("calendar", 18), el("span", { text: t("plan.book") })),
      el("div", { class: "save-plan" },
        el("label", { for: "planName", text: t("plan.saveName") }),
        el("div", { class: "save-row" }, name,
          el("button", { type: "button", class: "btn btn-ghost", onclick: () => {
            const v = name.value.trim();
            if (!v) { name.setAttribute("aria-invalid", "true"); name.focus(); return; }
            Store.savePlan(v, trip);
            Core.toast(t("plan.saved", { name: v }), { label: t("plan.openTrips"), onClick: () => { location.href = "trips.html#plans"; } });
          } }, el("span", { text: t("plan.save") })))),
      el("div", { class: "plan-more" },
        el("button", { type: "button", class: "btn btn-ghost btn-small", onclick: async () => {
          try { await navigator.clipboard.writeText(location.href); Core.toast(t("plan.linkCopied")); } catch (e) { Core.toast(t("plan.linkFailed")); }
        } }, el("span", { text: t("plan.copyLink") })),
        el("button", { type: "button", class: "btn btn-danger-ghost btn-small", onclick: () => {
          const before = trip;
          set({ stops: [] });
          Core.toast(t("plan.cleared"), { label: t("undo"), onClick: () => set(before) });
          focusLater("#addCity");
        } }, el("span", { text: t("plan.clear") }))));
  }

  Store.setDraft(trip, true);
  if (trip.stops.length) history.replaceState(null, "", "?" + Calc.tripToQuery(trip));
  Site.start(() => { form(); result(); }, { onChange: result });
})();
