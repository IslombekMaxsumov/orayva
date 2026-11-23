/* All the maths: routes between cities, the day-by-day plan, the trip price,
   warnings, destination search, form checks and the address (URL) state.
   Pure functions, also used by the tests in Node. */
(function (root) {
  "use strict";
  const D = typeof module !== "undefined" && module.exports ? require("./data.js") : root.DATA;
  const P = D.PRICES;

  /* ---------- travellers and cars ---------- */
  const people = (party) => party.adults + party.children;
  // cars needed: a sedan for up to 3, a minivan for 4–7, more minivans above that
  function vehicles(n) {
    if (n <= 3) return { count: 1, van: false };
    return { count: Math.ceil(n / 7), van: true };
  }

  /* ---------- routes ---------- */
  const GRAPH = {};
  D.LINKS.forEach(([a, b, mode, hours, price]) => {
    (GRAPH[a] ||= []).push({ to: b, mode, hours, price });
    (GRAPH[b] ||= []).push({ to: a, mode, hours, price });
  });
  // what one leg costs the whole group
  function legPrice(link, party, privateDriver) {
    if (link.mode === "car") {
      if (privateDriver) return 0; // the daily driver rate covers it
      const v = vehicles(people(party));
      return link.price * P.carKm * v.count * (v.van ? P.van : 1);
    }
    return link.price * (party.adults + party.children * P.childFare);
  }
  /* The best way from one city to another (Dijkstra's shortest path).
     pref: "fastest" (fewest hours), "cheapest" (fewest so'm) or "comfort"
     (hours, but long car rides and night trains count extra). */
  function path(from, to, opts = {}) {
    if (from === to) return { legs: [], hours: 0, price: 0 };
    const party = opts.party || { adults: 2, children: 0 };
    const pref = opts.pref || "fastest";
    // every change of transport costs about an hour, and a flight about two more
    // at the airports, so a direct train can beat "train + flight" on paper
    const door = (l) => l.hours + 1 + (l.mode === "flight" ? 2 : 0);
    const weight = (l) => {
      if (pref === "cheapest") return legPrice(l, party, opts.privateDriver) + l.hours * 1000; // hours only break ties
      if (pref === "comfort") return door(l) + (l.mode === "car" && l.hours > 4 ? 3 : 0) + (l.mode === "train" && l.hours > 8 ? 4 : 0);
      return door(l);
    };
    const best = { [from]: 0 }, prev = {}, done = new Set();
    const queue = [from];
    while (queue.length) {
      queue.sort((x, y) => best[x] - best[y]);
      const at = queue.shift();
      if (done.has(at)) continue;
      done.add(at);
      if (at === to) break;
      for (const l of GRAPH[at] || []) {
        const w = best[at] + weight(l);
        if (best[l.to] === undefined || w < best[l.to]) { best[l.to] = w; prev[l.to] = { from: at, link: l }; queue.push(l.to); }
      }
    }
    if (best[to] === undefined) return null;
    const legs = [];
    for (let at = to; at !== from; at = prev[at].from) {
      const { from: f, link } = prev[at];
      legs.unshift({ from: f, to: at, mode: link.mode, hours: link.hours, price: legPrice(link, party, opts.privateDriver), km: link.mode === "car" ? link.price : null });
    }
    return { legs, hours: legs.reduce((s, l) => s + l.hours, 0), price: legs.reduce((s, l) => s + l.price, 0) };
  }

  /* ---------- the trip ---------- */
  const clampInt = (v, lo, hi, fallback) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };
  // tidy the stops: known cities only, 1–14 nights, the same city twice in a row becomes one stop
  function cleanStops(stops) {
    const out = [];
    (stops || []).forEach((s) => {
      if (!s || !D.city(s.city)) return;
      const nights = clampInt(s.nights, 1, 14, 1);
      const last = out[out.length - 1];
      if (last && last.city === s.city) last.nights = Math.min(14, last.nights + nights);
      else out.push({ city: s.city, nights });
    });
    return out.slice(0, 10);
  }
  const TRIP_DEFAULTS = { start: "tashkent", ret: "tashkent", adults: 2, children: 0, hotel: "three", guide: true, driver: false, month: 5, pref: "fastest", date: "" };
  function cleanTrip(trip) {
    const t = { ...TRIP_DEFAULTS, ...trip };
    t.stops = cleanStops(t.stops);
    if (!D.START_CITIES.includes(t.start)) t.start = "tashkent";
    if (t.ret && !D.START_CITIES.includes(t.ret)) t.ret = "";
    t.adults = clampInt(t.adults, 1, 10, 2);
    t.children = clampInt(t.children, 0, 6, 0);
    if (!D.CLASSES.includes(t.hotel)) t.hotel = "three";
    t.guide = !!t.guide; t.driver = !!t.driver;
    if (!["fastest", "cheapest", "comfort"].includes(t.pref)) t.pref = "fastest";
    if (/^\d{4}-\d{2}-\d{2}$/.test(t.date || "")) t.month = Number(t.date.slice(5, 7));
    else t.date = "";
    t.month = clampInt(t.month, 1, 12, 5);
    return t;
  }
  // the hotel class a city really has: a 5-star request in Muynak gets the best there
  function classIn(c, wanted) {
    if (c.maxClass === "yurt") return "yurt";
    const max = D.CLASSES.indexOf(c.maxClass);
    return D.CLASSES[Math.min(D.CLASSES.indexOf(wanted), max)];
  }
  // one night in a city for the group
  function nightPrice(c, trip) {
    const cls = classIn(c, trip.hotel);
    if (cls === "yurt") return P.yurt * (trip.adults + trip.children * P.childFare);
    const rooms = Math.ceil(trip.adults / 2);
    const extraBeds = Math.max(0, trip.children - rooms); // one child per room shares the bed
    const room = P.room[cls] * c.hotel * P.season[trip.month];
    return rooms * room + extraBeds * room * P.extraBed;
  }

  /* Build the whole trip: the legs between cities, a day-by-day plan with the
     sights spread over the days, the price and the warnings. */
  function plan(input) {
    const trip = cleanTrip(input);
    const party = { adults: trip.adults, children: trip.children };
    const ropts = { party, pref: trip.pref, privateDriver: trip.driver };
    const warnings = [];
    const days = [];
    const legs = [];
    let current = trip.start;
    let n = 1;

    const SLOTS = 3; // sights in a full day
    const travelCost = (hours) => Math.ceil(hours / 2.5); // slots a journey takes
    const pending = {}; // sights not yet placed, per stop

    const travel = (from, to) => {
      const r = path(from, to, ropts);
      if (!r) { warnings.push({ type: "noRoute", from, to }); return null; }
      r.legs.forEach((l) => { legs.push(l); if (l.hours >= 7) warnings.push({ type: "longLeg", from: l.from, to: l.to, hours: l.hours, mode: l.mode }); });
      return r;
    };

    trip.stops.forEach((stop, i) => {
      const c = D.city(stop.city);
      const move = current !== stop.city ? travel(current, stop.city) : null;
      const list = c.sights.map((s) => s.id);
      pending[i] = list;
      for (let k = 0; k < stop.nights; k++) {
        let slots = SLOTS;
        const day = { n, city: stop.city, stop: i, travel: null, sights: [], night: stop.city };
        if (k === 0 && move && move.legs.length) { day.travel = move; slots -= travelCost(move.hours); }
        day.sights = list.splice(0, Math.max(0, slots));
        days.push(day);
        n++;
      }
      if (stop.nights < c.minNights) warnings.push({ type: "rushed", city: c.id, nights: stop.nights, min: c.minNights });
      if (c.heat.includes(trip.month)) warnings.push({ type: "heat", city: c.id, month: trip.month });
      if (c.snow.includes(trip.month)) warnings.push({ type: "snow", city: c.id, month: trip.month });
      if (classIn(c, trip.hotel) !== trip.hotel && c.maxClass !== "yurt") warnings.push({ type: "classLimit", city: c.id, cls: classIn(c, trip.hotel) });
      current = stop.city;
    });

    // the last day: a little time in the last city, then the way home
    if (trip.stops.length) {
      const lastIndex = trip.stops.length - 1;
      const back = trip.ret && trip.ret !== current ? travel(current, trip.ret) : null;
      const slots = back ? Math.max(0, 2 - travelCost(back.hours)) : 2;
      days.push({ n, city: current, stop: lastIndex, travel: back, sights: pending[lastIndex].splice(0, slots), night: null, last: true });
      Object.entries(pending).forEach(([i, left]) => { if (left.length) warnings.push({ type: "missed", city: trip.stops[i].city, count: left.length }); });
    }

    const nights = trip.stops.reduce((s, x) => s + x.nights, 0);
    const price = priceOf(trip, legs, days.length);
    return { trip, legs, days, nights, dayCount: days.length, hours: legs.reduce((s, l) => s + l.hours, 0), price, warnings };
  }

  /* ---------- the price ---------- */
  function priceOf(trip, legs, dayCount) {
    const heads = trip.adults + trip.children;
    let hotels = 0, fees = 0;
    trip.stops.forEach((s) => {
      const c = D.city(s.city);
      hotels += nightPrice(c, trip) * s.nights;
      fees += c.fees * (trip.adults + trip.children * P.childFare);
    });
    const transport = legs.reduce((sum, l) => sum + l.price, 0);
    const v = vehicles(heads);
    const driver = trip.driver ? P.driverDay * v.count * (v.van ? P.van : 1) * dayCount : 0;
    const guide = trip.guide ? P.guide * dayCount : 0;
    const meals = P.meals * (trip.adults + trip.children * P.childMeals) * dayCount;
    const rate = (P.group.find(([from]) => heads >= from) || [0, 0])[1];
    const discount = Math.round((hotels + guide) * rate);
    const total = hotels + transport + driver + guide + fees + meals - discount;
    return { hotels, transport, driver, guide, fees, meals, discount, discountRate: rate, total, perPerson: heads ? total / heads : 0 };
  }
  const toUsd = (som) => som / P.usd;

  /* ---------- destinations ---------- */
  // how a city is reached from Tashkent, and roughly what a day there costs one person
  function cityStats(c, month = 5) {
    const way = path("tashkent", c.id, { pref: "fastest" });
    const trip = cleanTrip({ adults: 2, children: 0, hotel: "three", month, stops: [] });
    const perDay = nightPrice(c, trip) / 2 + P.meals + c.fees / Math.max(1, c.minNights);
    return { hours: way ? way.hours : null, modes: way ? [...new Set(way.legs.map((l) => l.mode))] : [], perDay };
  }
  const FILTER_DEFAULTS = { q: "", region: "", type: "", month: 0, maxHours: 0, sort: "popular" };
  const norm = (s) => String(s || "").toLowerCase().replace(/[ʻʼ‘’`]/g, "'").trim();
  function matchesText(c, q) {
    if (!q) return true;
    const hay = [c.id, ...Object.values(c.name), ...(D.ALIASES[c.id] || []), ...c.sights.flatMap((s) => Object.values(s.name))].map(norm);
    return hay.some((h) => h.includes(q));
  }
  function filterCities(f) {
    const q = norm(f.q);
    return D.CITIES.filter((c) =>
      matchesText(c, q) &&
      (!f.region || c.region === f.region) &&
      (!f.type || c.types.includes(f.type)) &&
      (!f.month || c.best.includes(Number(f.month))) &&
      (!f.maxHours || ((cityStats(c).hours ?? 99) <= Number(f.maxHours))));
  }
  function sortCities(list, sort, lang = "en") {
    const by = {
      popular: (a, b) => b.popular - a.popular,
      name: (a, b) => a.name[lang].localeCompare(b.name[lang], lang),
      near: (a, b) => (cityStats(a).hours ?? 99) - (cityStats(b).hours ?? 99),
      price: (a, b) => cityStats(a).perDay - cityStats(b).perDay,
    }[sort] || ((a, b) => b.popular - a.popular);
    return [...list].sort(by);
  }
  function toQuery(f) {
    const p = new URLSearchParams();
    Object.entries(FILTER_DEFAULTS).forEach(([k, def]) => { if (f[k] && String(f[k]) !== String(def)) p.set(k, f[k]); });
    return p.toString();
  }
  function fromQuery(search) {
    const p = new URLSearchParams(search);
    const f = { ...FILTER_DEFAULTS };
    if (p.get("q")) f.q = p.get("q").slice(0, 60);
    if (D.REGIONS.includes(p.get("region"))) f.region = p.get("region");
    if (D.TYPES.includes(p.get("type"))) f.type = p.get("type");
    const m = Number(p.get("month")); if (m >= 1 && m <= 12) f.month = m;
    const h = Number(p.get("maxHours")); if ([2, 4, 6].includes(h)) f.maxHours = h;
    if (["popular", "name", "near", "price"].includes(p.get("sort"))) f.sort = p.get("sort");
    return f;
  }

  /* ---------- the planner in the address bar ----------
     ?stops=samarkand-2,bukhara-2&start=tashkent&ret=tashkent&a=2&c=0&h=three&g=1&d=0&m=5&p=fastest&date= */
  function tripToQuery(t) {
    const p = new URLSearchParams();
    p.set("stops", t.stops.map((s) => `${s.city}-${s.nights}`).join(","));
    p.set("start", t.start); p.set("ret", t.ret || "none");
    p.set("a", t.adults); p.set("c", t.children); p.set("h", t.hotel);
    p.set("g", t.guide ? 1 : 0); p.set("d", t.driver ? 1 : 0); p.set("p", t.pref);
    if (t.date) p.set("date", t.date); else p.set("m", t.month);
    return p.toString();
  }
  function tripFromQuery(search) {
    const p = new URLSearchParams(search);
    if (p.get("tour") && D.tour(p.get("tour"))) return tourTrip(D.tour(p.get("tour")));
    if (!p.get("stops") && !p.get("add")) return null;
    const stops = (p.get("stops") || "").split(",").filter(Boolean).map((x) => { const [city, nights] = x.split("-"); return { city, nights: Number(nights) }; });
    if (p.get("add") && D.city(p.get("add"))) stops.push({ city: p.get("add"), nights: D.city(p.get("add")).minNights });
    return cleanTrip({
      stops, start: p.get("start") || "tashkent", ret: p.get("ret") === "none" ? "" : p.get("ret") || "tashkent",
      adults: p.get("a") ?? 2, children: p.get("c") ?? 0, hotel: p.get("h") || "three",
      guide: p.get("g") !== "0", driver: p.get("d") === "1", pref: p.get("p") || "fastest", month: p.get("m") || 5, date: p.get("date") || "",
    });
  }
  // a ready-made tour as a planner trip
  function tourTrip(t, extra = {}) {
    return cleanTrip({ stops: t.stops.map(([city, nights]) => ({ city, nights })), hotel: t.hotel, guide: t.guide, start: "tashkent", ret: "tashkent", ...extra });
  }

  /* ---------- dates ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    return isoDate(new Date(y, m - 1, d + n));
  }

  /* ---------- the booking form ---------- */
  function checkName(v) {
    const s = String(v || "").trim();
    if (!s) return "required";
    if (s.length < 2 || s.length > 60) return "length";
    return /^[\p{L}][\p{L}' .-]*$/u.test(s) ? "" : "letters";
  }
  function checkEmail(v) {
    const s = String(v || "").trim();
    if (!s) return "required";
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 100 ? "" : "invalid";
  }
  // an Uzbek number (+998 and 9 digits) or any international number (8–15 digits after +)
  function checkPhone(v) {
    const s = String(v || "").replace(/[\s()-]/g, "");
    if (!s) return "required";
    if (s.startsWith("+998")) return /^\+998\d{9}$/.test(s) ? "" : "uz";
    return /^\+[1-9]\d{7,14}$/.test(s) ? "" : "invalid";
  }
  // the trip starts 3 to 365 days from today
  function checkStart(v, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "")) return "required";
    if (v < addDays(today, 3)) return "soon";
    if (v > addDays(today, 365)) return "far";
    return "";
  }
  function bookingCode(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) { code += abc[(h >>> 0) % abc.length]; h = Math.imul(h ^ (h >>> 13), 2654435761); }
    return "UZ-" + code;
  }

  const Calc = { people, vehicles, legPrice, path, cleanStops, cleanTrip, classIn, nightPrice, plan, priceOf, toUsd, cityStats, filterCities, sortCities, FILTER_DEFAULTS, toQuery, fromQuery, tripToQuery, tripFromQuery, tourTrip, isoDate, addDays, checkName, checkEmail, checkPhone, checkStart, bookingCode, TRIP_DEFAULTS };
  if (typeof module !== "undefined" && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(typeof window !== "undefined" ? window : globalThis);
