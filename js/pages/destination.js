/* One destination (destination.html?id=samarkand): photo, about, key facts,
   a 12-month "when to go" strip, the sights, three ways to get there from
   Tashkent (fastest, cheapest, most comfortable) and the tours that go there. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, $, icon } = Site;
  const c = DATA.city(new URLSearchParams(location.search).get("id"));
  if (c) Store.addRecent(c.id);

  function crumbs() {
    $("crumbs").replaceChildren(el("ol", null,
      el("li", null, el("a", { href: "index.html", text: t("page.home") })),
      el("li", null, el("a", { href: "destinations.html", text: t("page.destinations") })),
      el("li", null, el("span", { "aria-current": "page", text: c ? c.name[Site.lang()] : t("dest.notFound") }))));
  }

  // 12 small cells: good, hot, snowy or so-so, with the month name for screen readers
  function seasonStrip() {
    return el("ol", { class: "season-strip", "aria-label": t("dest.seasonLabel") }, Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const kind = c.best.includes(m) ? "best" : c.heat.includes(m) ? "heat" : c.snow.includes(m) ? "snow" : "ok";
      return el("li", { class: "season-" + kind, title: `${Site.monthName(m)}: ${t("season." + kind)}` },
        el("span", { "aria-hidden": "true", text: t("monthS." + m).slice(0, 3) }),
        el("span", { class: "visually-hidden", text: `${Site.monthName(m)}: ${t("season." + kind)}` }));
    }));
  }

  // fastest / cheapest / comfort, showing each leg
  function ways() {
    if (c.id === "tashkent") return el("p", { text: t("dest.isStart") });
    const seen = new Set();
    const rows = ["fastest", "cheapest", "comfort"].map((pref) => {
      const r = Calc.path("tashkent", c.id, { pref });
      const key = r.legs.map((l) => l.from + l.to + l.mode).join();
      const dup = seen.has(key);
      seen.add(key);
      return { pref, r, dup };
    });
    return el("ul", { class: "way-list" }, rows.map(({ pref, r, dup }) => el("li", { class: "way" },
      el("p", { class: "way-title" }, el("strong", { text: t("pref." + pref) }), dup ? el("span", { class: "hint", text: " " + t("dest.sameWay") }) : null),
      el("ol", { class: "way-legs" }, r.legs.map((l) => el("li", null, icon(Site.modeIcon[l.mode], 16), el("span", { text: t("dest.leg", { mode: t("mode." + l.mode), to: Site.cityName(l.to), time: Site.hours(l.hours) }) })))),
      el("p", { class: "way-total num" }, t("dest.wayTotal", { time: Site.hours(r.hours), sum: Site.money(r.price / 2) })))));
  }

  // the other photos of the place, side by side, each with its credit
  function morePhotos() {
    const list = ((window.PHOTOS && PHOTOS[c.id]) || []).slice(1);
    if (!list.length) return "";
    return el("div", { class: "dest-more dest-more-" + list.length }, list.map((p, i) =>
      el("div", { class: "dest-more-item" }, Site.photo(c, { index: i + 1, sizes: "(min-width: 900px) 50vw, 100vw" }), Site.credit(p))));
  }

  function render() {
    crumbs();
    const view = $("view");
    if (!c) {
      view.replaceChildren(el("div", { class: "empty" }, el("h1", { text: t("dest.notFound") }), el("a", { class: "btn", href: "destinations.html", text: t("dest.all") })));
      return;
    }
    const L = Site.lang();
    const st = Calc.cityStats(c, new Date().getMonth() + 1);
    const tours = DATA.TOURS.filter((tr) => tr.stops.some(([id]) => id === c.id));
    view.replaceChildren(
      el("div", { class: "dest-hero" },
        el("div", { class: "dest-figure" }, Site.photo(c, { eager: true, cls: "dest-photo", sizes: "(min-width: 1240px) 1240px, 100vw" }), Site.credit((window.PHOTOS && PHOTOS[c.id] || [])[0])),
        el("div", { class: "dest-head" },
          el("p", { class: "eyebrow" }, el("span", { text: t("region." + c.region) }), el("span", { class: "dest-types", text: c.types.map((x) => t("type." + x)).join(" · ") })),
          el("h1", { text: c.name[L] }),
          el("p", { class: "dest-lead", text: c.about[L] }))),
      el("div", { class: "dest-facts-row" },
          el("dl", { class: "dest-facts" },
            el("div", null, el("dt", { text: t("dest.fromTashkent") }), el("dd", { text: c.id === "tashkent" ? t("city.isStart") : `${Site.hours(st.hours)} · ${st.modes.map((m) => t("mode." + m)).join(" + ")}` })),
            el("div", null, el("dt", { text: t("dest.stay") }), el("dd", { text: t("dest.nights", { count: c.minNights }) })),
            el("div", null, el("dt", { text: t("dest.perDay") }), el("dd", { text: Site.money(st.perDay) })),
            el("div", null, el("dt", { text: t("dest.hotels") }), el("dd", { text: t("hotel." + (c.maxClass === "yurt" ? "yurt" : c.maxClass + "Max")) }))),
          el("div", { class: "dest-actions" },
            el("button", { type: "button", class: "btn", id: "addTrip", onclick: () => {
              Store.addToDraft(c.id);
              Core.toast(t("dest.added", { name: c.name[L] }), { label: t("dest.openPlanner"), onClick: () => { location.href = "planner.html"; } });
            } }, icon("plus", 18), el("span", { text: t("dest.addTrip") })),
            Site.saveButton(c, true)),
          el("p", { class: "hint dest-note", text: t("dest.perDayNote") })),
      morePhotos(),
      el("section", { class: "section", "aria-labelledby": "whenTitle" },
        el("h2", { id: "whenTitle", text: t("dest.when") }), seasonStrip(),
        el("ul", { class: "season-key" }, ["best", "ok", "heat", "snow"].filter((k) => k === "best" || k === "ok" || c[k].length).map((k) => el("li", { class: "season-" + k }, el("span", { class: "dot", "aria-hidden": "true" }), t("season." + k))))),
      el("section", { class: "section", "aria-labelledby": "sightTitle" },
        el("h2", { id: "sightTitle", text: t("dest.sights", { count: c.sights.length }) }),
        el("ol", { class: "sight-list" }, c.sights.map((s, i) => el("li", null, el("span", { class: "sight-n num", "aria-hidden": "true", text: String(i + 1).padStart(2, "0") }), el("h3", { text: s.name[L] }), el("p", { text: s.text[L] }))))),
      el("section", { class: "section", "aria-labelledby": "wayTitle" },
        el("h2", { id: "wayTitle", text: t("dest.ways") }), el("p", { class: "hint", text: t("dest.waysNote") }), ways()),
      tours.length ? el("section", { class: "section", "aria-labelledby": "tourTitle" },
        el("h2", { id: "tourTitle", text: t("dest.tours") }), el("div", { class: "tour-list" }, tours.map(Site.tourCard))) : "");
  }

  Site.start(render, { title: () => (c ? c.name[Site.lang()] : t("dest.notFound")), onChange: () => {
    const b = document.querySelector(".dest-actions .save-btn");
    if (b && c) b.replaceWith(Site.saveButton(c, true));
  } });
})();
