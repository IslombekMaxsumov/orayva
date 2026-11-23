/* Parts shared by every page: header (menu, language, currency, theme),
   footer, cards, photos, formatting and page start-up.
   A page calls  Site.start(render)  and `render` runs again when the
   language or the saved data change. Text from data goes in with textContent. */
(function () {
  "use strict";
  const { t } = Core;
  const page = document.body.dataset.page;
  const lang = () => Core.getLang();

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    children.flat(Infinity).forEach((c) => c !== null && c !== undefined && c !== false && c !== "" && node.append(c));
    return node;
  }
  function svgEl(tag, attrs, ...children) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => v !== null && v !== undefined && v !== false && node.setAttribute(k, v));
    children.flat().forEach((c) => c && node.append(c));
    return node;
  }
  const $ = (id) => document.getElementById(id);

  /* ---------- icons (Lucide, ISC licence; fixed strings) ---------- */
  const ICONS = {
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15M9 3.236v15"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    train: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1M15 15l1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3M16 19l2 3"/>',
    flight: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    calendar: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
  };
  function icon(name, size = 20) {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "icon icon-" + name });
    s.innerHTML = ICONS[name] || "";
    return s;
  }

  /* ---------- formatting ---------- */
  // Uzbek groups digits with spaces like Russian; many browsers have no Uzbek number data
  const NUM_LOCALE = { en: "en-GB", ru: "ru-RU", uz: "ru-RU" };
  function num(n, digits = 0) {
    try { return new Intl.NumberFormat(NUM_LOCALE[lang()], { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n); }
    catch (e) { return String(Math.round(n)); }
  }
  // a price in the visitor's currency: "3 920 000 so'm" or "$310"
  function money(som) {
    if (Store.currency() === "usd") return t("money.usd", { n: num(Math.round(Calc.toUsd(som))) });
    return t("money.som", { n: num(Math.round(som / 1000) * 1000) });
  }
  // short form for cards: "9.9 mln so'm" or "$786"
  function moneyShort(som) {
    if (Store.currency() === "usd") return t("money.usd", { n: num(Math.round(Calc.toUsd(som))) });
    return som >= 1e6 ? t("money.mln", { n: num(som / 1e6, som < 1e7 ? 1 : 0) }) : t("money.som", { n: num(Math.round(som / 1000) * 1000) });
  }
  // 2.2 → "2 h 12 min"
  function hours(h) {
    const total = Math.round(h * 60);
    const hh = Math.floor(total / 60), mm = total % 60;
    if (!hh) return t("unit.min", { m: mm });
    return mm ? t("unit.hm", { h: hh, m: mm }) : t("unit.h", { h: hh });
  }
  const cityName = (id) => (DATA.city(id) ? DATA.city(id).name[lang()] : id);
  const monthName = (m) => t("month." + m);
  // "Sat, 12 April" (Uzbek month names come from our own list: browsers often lack them)
  function dateText(iso, withYear) {
    const [y, m, d] = iso.split("-").map(Number);
    if (lang() === "uz") return `${d}-${t("monthGen." + m)}${withYear ? ` ${y}` : ""}`;
    return Core.formatDate(new Date(y, m - 1, d), { day: "numeric", month: "long", year: withYear ? "numeric" : undefined });
  }
  const todayIso = () => Calc.isoDate(new Date());
  // "2 adults, 1 child" with the right plural forms
  const who = (trip) => [t("who.adults", { count: trip.adults }), trip.children ? t("who.children", { count: trip.children }) : ""].filter(Boolean).join(", ");

  /* ---------- photos (js/photos.js, added later) ---------- */
  function photo(c, opts = {}) {
    const list = (window.PHOTOS && PHOTOS[c.id]) || [];
    const p = list[opts.index || 0];
    const cls = "photo" + (opts.cls ? " " + opts.cls : "");
    if (!p) {
      return el("figure", { class: cls },
        el("div", { class: "photo-fallback", role: "img", "aria-label": t("photo.none", { name: c.name[lang()] }) },
          el("span", { class: "photo-fallback-brand", "aria-hidden": "true", text: t("region." + c.region) }),
          el("span", { class: "photo-fallback-name", "aria-hidden": "true", text: c.name[lang()] })));
    }
    return el("figure", { class: cls }, el("img", {
      src: (p.sizes.find((s) => s[0] >= 900) || p.sizes[p.sizes.length - 1])[1],
      srcset: p.sizes.map(([w, f]) => `${f} ${w}w`).join(", "),
      sizes: opts.sizes || "(min-width: 960px) 33vw, 100vw",
      alt: p.alt[lang()], loading: opts.eager ? "eager" : "lazy", decoding: "async",
      style: p.pos ? `object-position: ${p.pos}` : null,
    }));
  }

  /* ---------- save button ---------- */
  function saveButton(c, withText) {
    const on = Store.isSaved(c.id);
    return el("button", {
      type: "button", class: "save-btn" + (withText ? " btn btn-ghost" : " icon-btn"), "aria-pressed": String(on), "data-save": c.id,
      "aria-label": withText ? null : t(on ? "save.remove" : "save.add", { name: c.name[lang()] }),
      onclick: () => {
        const now = Store.toggleSaved(c.id);
        Core.toast(t(now ? "save.added" : "save.removed", { name: c.name[lang()] }));
        const again = document.querySelector(`[data-save="${c.id}"]`);
        if (again) again.focus();
      },
    }, icon("heart", 18), withText && el("span", { text: t(on ? "save.saved" : "save.save") }));
  }

  /* ---------- cards ---------- */
  const modeIcon = { train: "train", flight: "flight", car: "car" };
  function wayLine(c) {
    const st = Calc.cityStats(c, new Date().getMonth() + 1);
    if (c.id === "tashkent") return t("city.isStart");
    return t("city.fromTashkent", { time: hours(st.hours), by: st.modes.map((m) => t("mode." + m)).join(" + ") });
  }
  function cityCard(c) {
    const st = Calc.cityStats(c, new Date().getMonth() + 1);
    return el("article", { class: "city-card", "data-city": c.id },
      el("div", { class: "card-photo" }, photo(c, { sizes: "(min-width: 960px) 30vw, (min-width: 640px) 45vw, 100vw" })),
      el("div", { class: "card-body" },
        el("p", { class: "card-region", text: t("region." + c.region) }),
        el("h3", { class: "card-title" }, el("a", { href: "destination.html?id=" + c.id, text: c.name[lang()] })),
        el("p", { class: "card-about", text: c.about[lang()] }),
        el("ul", { class: "card-facts" },
          el("li", null, icon("clock", 16), el("span", { text: wayLine(c) })),
          el("li", null, icon("calendar", 16), el("span", { text: t("city.best", { months: monthRange(c.best) }) })),
          el("li", null, icon("users", 16), el("span", { text: t("city.perDay", { sum: moneyShort(st.perDay) }) }))),
        el("div", { class: "card-actions" }, saveButton(c))));
  }
  // [4, 5, 9, 10] → "Apr–May, Sep–Oct"
  function monthRange(list) {
    const sorted = [...list].sort((a, b) => a - b);
    const runs = [];
    sorted.forEach((m) => { const r = runs[runs.length - 1]; if (r && m === r[1] + 1) r[1] = m; else runs.push([m, m]); });
    // December and January join up across the new year
    if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) { const last = runs.pop(); runs[0] = [last[0], runs[0][1]]; }
    return runs.map(([a, b]) => (a === b ? t("monthS." + a) : `${t("monthS." + a)}–${t("monthS." + b)}`)).join(", ");
  }
  function tourCard(tr) {
    const trip = Calc.tourTrip(tr, { month: new Date().getMonth() + 1 });
    const p = Calc.plan(trip);
    return el("article", { class: "tour-card", "data-tour": tr.id },
      el("div", { class: "card-body" },
        el("p", { class: "card-region", text: t("tour.length", { days: p.dayCount, nights: p.nights, count: p.dayCount }) }),
        el("h3", { class: "card-title" }, el("a", { href: "planner.html?tour=" + tr.id, text: tr.name[lang()] })),
        el("p", { class: "tour-route", text: [trip.start, ...trip.stops.map((s) => s.city)].filter((c, i, a) => c !== a[i - 1]).map(cityName).join(" → ") }),
        el("p", { class: "card-about", text: tr.about[lang()] }),
        el("p", { class: "tour-price" }, el("span", { class: "label", text: t("tour.from") }), " ", el("strong", { class: "price", text: moneyShort(p.price.perPerson) }), " ", el("span", { class: "hint", text: t("tour.perPerson") })),
        el("a", { class: "btn btn-ghost btn-small", href: "planner.html?tour=" + tr.id }, icon("route", 16), el("span", { text: t("tour.open") }))));
  }

  /* ---------- small form helpers ---------- */
  function choice({ name, legend, options, value, onChange }) {
    return el("fieldset", { class: "choice" },
      el("legend", { text: legend }),
      el("div", { class: "chip-row" }, options.map(([v, text]) =>
        el("label", { class: "chip chip-radio" },
          el("input", { type: "radio", name, value: v, checked: String(v) === String(value), onchange: () => onChange(v) }),
          el("span", { text })))));
  }
  // a number with − and + buttons; the input stays typeable
  function stepper({ id, label, value, min, max, onChange, hint }) {
    const input = el("input", { id, type: "number", class: "input stepper-input", inputmode: "numeric", min, max, value,
      onchange: (e) => { const v = Math.min(max, Math.max(min, Math.round(Number(e.target.value) || min))); e.target.value = v; onChange(v); } });
    const go = (d) => { const v = Math.min(max, Math.max(min, Number(input.value) + d)); input.value = v; onChange(v); };
    return el("div", { class: "field stepper" },
      el("label", { for: id, text: label }),
      el("div", { class: "stepper-row" },
        el("button", { type: "button", class: "icon-btn", "aria-label": t("step.less", { what: label }), "data-step": id + "-", disabled: value <= min, onclick: () => go(-1) }, icon("minus", 18)),
        input,
        el("button", { type: "button", class: "icon-btn", "aria-label": t("step.more", { what: label }), "data-step": id + "+", disabled: value >= max, onclick: () => go(1) }, icon("plus", 18))),
      hint && el("p", { class: "hint", text: hint }));
  }
  function switchField({ id, label, checked, onChange, hint }) {
    return el("div", { class: "field" },
      el("label", { class: "switch", for: id }, el("input", { type: "checkbox", id, role: "switch", checked, onchange: (e) => onChange(e.target.checked) }), el("span", { text: label })),
      hint && el("p", { class: "hint", text: hint }));
  }

  /* ---------- an all-day calendar event for a booked trip ---------- */
  function icsLink(b) {
    const end = Calc.addDays(b.trip.date, b.days); // all-day events end the day after
    const esc = (s) => String(s).replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const stamp = new Date(b.created || Date.now()).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travel demo//EN", "BEGIN:VEVENT",
      `UID:${b.code}@travel.demo`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${b.trip.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${end.replace(/-/g, "")}`,
      `SUMMARY:${esc(t("book.icsTitle", { route: b.trip.stops.map((s) => cityName(s.city)).join(" – ") }))}`,
      `DESCRIPTION:${esc(t("book.icsText", { code: b.code }))}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return el("a", { class: "btn btn-ghost btn-small", download: `trip-${b.code}.ics`, href: "data:text/calendar;charset=utf-8," + encodeURIComponent(text) },
      icon("calendar", 16), el("span", { text: t("book.addCalendar") }));
  }

  /* ---------- header and footer ---------- */
  const NAV = [["home", "index.html", "home"], ["destinations", "destinations.html", "map"], ["planner", "planner.html", "route"], ["trips", "trips.html", "briefcase"]];
  const ALSO = { destination: "destinations", booking: "planner" }; // pages without their own menu item
  function renderHeader() {
    const host = $("site-header");
    if (!host) return;
    const current = ALSO[page] || page;
    const nav = el("nav", { class: "site-nav", "data-i18n-aria": "nav.label" },
      el("ul", null, NAV.map(([key, href, ic]) =>
        el("li", null, el("a", { href, "aria-current": current === key ? "page" : null },
          icon(ic, 20), el("span", { class: "nav-full", "data-i18n": "page." + key }), el("span", { class: "nav-short", "aria-hidden": "true", "data-i18n": "nav.short." + key }),
          key === "trips" ? el("span", { class: "nav-count", id: "tripCount" }) : null)))));
    const langs = el("div", { class: "seg", role: "group", "data-i18n-aria": "lang.label" },
      ["uz", "ru", "en"].map((code) => el("button", { type: "button", "data-lang": code, lang: code, text: code.toUpperCase() })));
    const cur = el("div", { class: "seg", role: "group", id: "currency", "data-i18n-aria": "currency.label" },
      [["uzs", "UZS"], ["usd", "USD"]].map(([code, text]) => el("button", { type: "button", "data-currency": code, text, onclick: () => Store.setCurrency(code) })));
    const theme = el("button", { type: "button", id: "themeToggle", class: "icon-btn" }, el("span", { class: "i-sun" }, icon("sun", 20)), el("span", { class: "i-moon" }, icon("moon", 20)));
    host.append(el("div", { class: "container header-bar" },
      el("a", { class: "brand", href: "index.html" }, el("span", { class: "brand-word", "data-i18n": "brand.name" }), el("span", { class: "visually-hidden", "data-i18n": "brand.home" })),
      nav,
      el("div", { class: "header-tools" }, cur, langs, theme)));
  }
  function renderBadges() {
    document.querySelectorAll("[data-currency]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.currency === Store.currency())));
    const c = $("tripCount");
    if (!c) return;
    const n = Store.saved().length + Store.plans().length + Store.bookings().filter((b) => b.status !== "cancelled").length;
    c.textContent = n ? String(n) : "";
    c.setAttribute("aria-label", n ? t("trips.count", { count: n }) : "");
  }
  function renderFooter() {
    const host = $("site-footer");
    if (!host) return;
    host.replaceChildren(el("div", { class: "container footer-inner" },
      el("div", { class: "footer-brand" }, el("p", { class: "brand-word", text: t("brand.name") }), el("p", { text: t("footer.about") })),
      el("div", { class: "footer-col" }, el("h2", { text: t("footer.plan") }),
        el("ul", null, [["destinations", "destinations.html"], ["planner", "planner.html"], ["trips", "trips.html"]].map(([k, href]) => el("li", null, el("a", { href, text: t("page." + k) }))))),
      el("div", { class: "footer-col" }, el("h2", { text: t("footer.offices") }),
        el("ul", null, DATA.OFFICES.map((o) => el("li", null, o.address[lang()])))),
      el("p", { class: "footer-hours", text: t("footer.hours") }),
      el("div", { class: "footer-bottom" }, el("p", { text: t("footer.demo") }), el("p", { text: t("footer.copy") }))));
  }

  /* ---------- start ---------- */
  let titleFn = null;
  function setTitle() {
    const part = titleFn ? titleFn() : "";
    document.title = part ? `${part} — ${t("brand.name")}` : t("meta.title");
  }
  function start(render, options = {}) {
    titleFn = options.title || null;
    renderHeader();
    Core.onLang(() => { renderFooter(); renderBadges(); render(); setTitle(); });
    Store.onChange(() => { renderBadges(); if (options.onChange) options.onChange(); else render(); });
    Core.init();
  }

  window.Site = { el, svgEl, $, icon, num, money, moneyShort, hours, cityName, monthName, monthRange, dateText, todayIso, who, photo, saveButton, cityCard, tourCard, wayLine, modeIcon, choice, stepper, switchField, icsLink, setTitle, start, lang };
})();
