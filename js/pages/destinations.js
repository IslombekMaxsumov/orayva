/* Destinations: search (also other spellings and sight names), region, trip
   type, good month, travel time from Tashkent and sort. The filters live in
   the address, so a search can be shared or bookmarked. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $ } = Site;
  let f = Calc.fromQuery(location.search);

  const opts = (list, value) => list.map(([v, text]) => el("option", { value: v, selected: String(v) === String(value), text }));
  function fields() {
    $("q").value = f.q;
    $("region").replaceChildren(...opts([["", t("filter.any")], ...DATA.REGIONS.map((r) => [r, t("region." + r)])], f.region));
    $("month").replaceChildren(...opts([[0, t("filter.anyMonth")], ...Array.from({ length: 12 }, (_, i) => [i + 1, Site.monthName(i + 1)])], f.month));
    $("maxHours").replaceChildren(...opts([[0, t("filter.anyTime")], ...[2, 4, 6].map((h) => [h, t("filter.upTo", { time: Site.hours(h) })])], f.maxHours));
    $("sort").replaceChildren(...opts(["popular", "near", "price", "name"].map((s) => [s, t("sort." + s)]), f.sort));
    $("typeChips").replaceChildren(...[["", t("filter.anyType")], ...DATA.TYPES.map((x) => [x, t("type." + x)])].map(([v, text]) =>
      el("label", { class: "chip chip-radio" }, el("input", { type: "radio", name: "type", value: v, checked: f.type === v, onchange: () => update({ type: v }) }), el("span", { text }))));
  }
  function list() {
    const found = Calc.sortCities(Calc.filterCities(f), f.sort, Site.lang());
    $("count").textContent = t("dest.count", { count: found.length });
    $("list").replaceChildren(...found.map((c, i) => Site.cityCard(c, { size: i % 6 === 0 ? "wide" : "" })));
    $("empty").hidden = found.length > 0;
    $("reset").hidden = Calc.toQuery(f) === "";
    // the phone filter button says how many filters are on
    const on = ["region", "type", "month", "maxHours"].filter((k) => f[k]).length;
    $("filtersToggle").textContent = on ? t("filter.toggleN", { count: on }) : t("filter.toggle");
  }
  function update(change) {
    f = { ...f, ...change };
    const q = Calc.toQuery(f);
    history.replaceState(null, "", q ? "?" + q : location.pathname);
    list();
  }
  function reset() { f = { ...Calc.FILTER_DEFAULTS }; history.replaceState(null, "", location.pathname); fields(); list(); $("q").focus(); }

  $("q").addEventListener("input", (e) => update({ q: e.target.value }));
  $("region").addEventListener("change", (e) => update({ region: e.target.value }));
  $("month").addEventListener("change", (e) => update({ month: Number(e.target.value) }));
  $("maxHours").addEventListener("change", (e) => update({ maxHours: Number(e.target.value) }));
  $("sort").addEventListener("change", (e) => update({ sort: e.target.value }));
  $("filters").addEventListener("submit", (e) => e.preventDefault());
  $("filtersToggle").addEventListener("click", () => {
    const open = $("filtersToggle").getAttribute("aria-expanded") !== "true";
    $("filtersToggle").setAttribute("aria-expanded", String(open));
    $("filters").classList.toggle("is-open", open);
  });
  $("reset").addEventListener("click", reset);
  $("reset2").addEventListener("click", reset);

  Site.start(() => { fields(); list(); }, { onChange: list });
})();
