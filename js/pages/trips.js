/* My trips: booking requests (with cancel and undo), saved plans (open in
   the planner, delete with undo), saved destinations and recently viewed. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $ } = Site;

  const empty = (key, href, link) => el("div", { class: "empty" }, el("p", { text: t(key) }), href ? el("a", { class: "btn btn-ghost btn-small", href, text: t(link) }) : "");
  const route = (trip) => trip.stops.map((s) => Site.cityName(s.city)).join(" → ");

  function bookings() {
    const list = Store.bookings();
    if (!list.length) return empty("trips.noBookings", "planner.html", "page.planner");
    return el("ul", { class: "booking-list" }, list.map((b) => {
      const end = Calc.addDays(b.trip.date, b.days - 1);
      const past = end < Site.todayIso();
      const cancelled = b.status === "cancelled";
      return el("li", { class: "booking" + (cancelled ? " is-cancelled" : "") + (past ? " is-past" : "") },
        el("p", { class: "booking-code" }, el("strong", { text: b.code }), " ", el("span", { class: "badge", text: t("status." + (cancelled ? "cancelled" : past ? "past" : "requested")) })),
        el("p", { class: "booking-route", text: route(b.trip) }),
        el("p", { class: "hint", text: `${Site.dateText(b.trip.date)} – ${Site.dateText(end, true)} · ${Site.who(b.trip)} · ${Site.money(b.total)}` }),
        cancelled || past ? "" : el("div", { class: "booking-actions" },
          Site.icsLink(b),
          el("a", { class: "btn btn-ghost btn-small", href: "planner.html?" + Calc.tripToQuery(b.trip), text: t("trips.openPlan") }),
          el("button", { type: "button", class: "btn btn-danger-ghost btn-small", onclick: () => {
            const undo = Store.cancelBooking(b.code);
            Core.toast(t("trips.cancelled", { code: b.code }), { label: t("undo"), onClick: undo });
          } }, el("span", { text: t("trips.cancel") }))));
    }));
  }
  function plans() {
    const list = Store.plans();
    if (!list.length) return empty("trips.noPlans", "planner.html", "page.planner");
    return el("ul", { class: "plan-list" }, list.map((p) => {
      const x = Calc.plan(p.trip);
      return el("li", { class: "saved-plan" },
        el("h3", null, el("a", { href: "planner.html?" + Calc.tripToQuery(p.trip), text: p.name })),
        el("p", { class: "booking-route", text: route(p.trip) }),
        el("p", { class: "hint", text: `${t("plan.line", { days: x.dayCount, nights: x.nights, count: x.dayCount, time: Site.hours(x.hours) })} · ${Site.money(x.price.total)}` }),
        el("div", { class: "booking-actions" },
          el("a", { class: "btn btn-ghost btn-small", href: "planner.html?" + Calc.tripToQuery(p.trip), text: t("trips.openPlan") }),
          el("button", { type: "button", class: "btn btn-danger-ghost btn-small", onclick: () => {
            const undo = Store.removePlan(p.id);
            Core.toast(t("trips.planRemoved", { name: p.name }), { label: t("undo"), onClick: undo });
          } }, el("span", { text: t("trips.remove") }))));
    }));
  }
  function cards(ids, key) {
    return ids.length ? el("div", { class: "place-strip" }, ids.map((id) => Site.cityCard(DATA.city(id), { size: "small" }))) : empty(key, "destinations.html", "page.destinations");
  }

  function render() {
    $("bookingList").replaceChildren(bookings());
    $("planList").replaceChildren(plans());
    $("savedList").replaceChildren(cards(Store.saved(), "trips.noSaved"));
    $("recentList").replaceChildren(cards(Store.recent(), "trips.noRecent"));
  }
  Site.start(render);
})();
