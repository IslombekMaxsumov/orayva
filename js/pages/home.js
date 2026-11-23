/* Home: a quick trip start (pick places, month, people → the planner),
   what is good this month, ready-made tours, how it works, recently viewed. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $ } = Site;
  const QUICK = ["samarkand", "bukhara", "khiva", "tashkent", "fergana", "nurata", "chimgan", "nukus"];
  const state = { cities: [], month: new Date().getMonth() + 1, people: 2 };

  function quickPlan() {
    $("qpCities").replaceChildren(...QUICK.map((id) => el("label", { class: "chip" },
      el("input", { type: "checkbox", value: id, checked: state.cities.includes(id), onchange: (e) => {
        state.cities = e.target.checked ? [...state.cities, id] : state.cities.filter((x) => x !== id);
        summary();
      } }), el("span", { text: Site.cityName(id) }))));
    $("qpMonth").replaceChildren(...Array.from({ length: 12 }, (_, i) => el("option", { value: i + 1, selected: i + 1 === state.month, text: Site.monthName(i + 1) })));
    $("qpPeople").replaceChildren(...Array.from({ length: 8 }, (_, i) => el("option", { value: i + 1, selected: i + 1 === state.people, text: t("home.qpPeopleN", { count: i + 1 }) })));
    summary();
  }
  // a live preview: "5 days · about 4.1 mln so'm per person"
  function summary() {
    const out = $("qpSummary");
    if (!state.cities.length) { out.textContent = t("home.qpPick"); return; }
    $("qpError").textContent = "";
    const p = Calc.plan(trip());
    out.textContent = t("home.qpPreview", { days: p.dayCount, count: p.dayCount, sum: Site.moneyShort(p.price.perPerson) });
  }
  // the order on the map: west to east is not how people travel, so keep the classic order
  const ORDER = ["tashkent", "chimgan", "fergana", "samarkand", "nurata", "bukhara", "khiva", "nukus"];
  function trip() {
    const stops = [...state.cities].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((id) => ({ city: id, nights: DATA.city(id).minNights }));
    return Calc.cleanTrip({ stops, month: state.month, adults: state.people });
  }

  function season() {
    const m = new Date().getMonth() + 1;
    $("seasonTitle").textContent = t("home.seasonTitle", { month: Site.monthName(m) });
    $("seasonMore").href = "destinations.html?month=" + m;
    // the best places for this month first, topped up to three with places that are fine then (not too hot or snowy)
    const good = Calc.sortCities(DATA.CITIES.filter((c) => c.best.includes(m)), "popular");
    const fine = Calc.sortCities(DATA.CITIES.filter((c) => !good.includes(c) && !c.heat.includes(m) && !c.snow.includes(m)), "popular");
    $("seasonList").replaceChildren(...[...good, ...fine].slice(0, 3).map((c, i) => Site.cityCard(c, { size: i === 0 ? "wide" : "" })));
  }

  // the hero: one photograph, its place and coordinates, and the credit
  function hero() {
    const H = window.HERO;
    if (!H) return;
    const L = Site.lang();
    $("heroPhoto").replaceChildren(el("img", {
      src: (H.sizes.find((s) => s[0] >= 1600) || H.sizes[H.sizes.length - 1])[1],
      srcset: H.sizes.map(([w, f]) => `${f} ${w}w`).join(", "), sizes: "100vw",
      alt: H.alt[L], fetchpriority: "high", decoding: "async", style: H.pos ? `object-position: ${H.pos}` : null }));
    $("heroPlace").textContent = H.place[L];
    $("heroCoords").textContent = H.coords;
    $("heroCredit").replaceChildren(Site.credit(H, "hero-credit-text"));
  }

  function render() {
    hero();
    quickPlan();
    season();
    $("tourList").replaceChildren(...DATA.TOURS.slice(0, 6).map(Site.tourCard));
    $("howList").replaceChildren(...[1, 2, 3].map((n) => el("li", null, el("span", { class: "how-n num", "aria-hidden": "true", text: "0" + n }), el("strong", { text: t(`home.how${n}`) }), el("span", { class: "how-text", text: t(`home.how${n}Text`) }))));
    const recent = Store.recent().map(DATA.city);
    $("recentSection").hidden = recent.length === 0;
    $("recentList").replaceChildren(...recent.slice(0, 4).map((c) => Site.cityCard(c, { size: "small" })));
  }

  $("qpMonth").addEventListener("change", (e) => { state.month = Number(e.target.value); summary(); });
  $("qpPeople").addEventListener("change", (e) => { state.people = Number(e.target.value); summary(); });
  $("quickPlan").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.cities.length) { $("qpError").textContent = t("home.qpError"); $("qpCities").querySelector("input").focus(); return; }
    location.href = "planner.html?" + Calc.tripToQuery(trip());
  });

  Site.start(render);
})();
