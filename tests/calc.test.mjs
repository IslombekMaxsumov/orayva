// node --test tests/calc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const D = require("../js/data.js");
const C = require("../js/calc.js");

test("every link joins two known cities and every city can be reached from Tashkent", () => {
  D.LINKS.forEach(([a, b]) => { assert.ok(D.city(a), a); assert.ok(D.city(b), b); });
  D.CITIES.forEach((c) => assert.ok(C.path("tashkent", c.id), c.id));
});

test("route preferences: Tashkent to Khiva", () => {
  const fast = C.path("tashkent", "khiva", { pref: "fastest" });
  assert.equal(fast.legs.length, 1);
  assert.equal(fast.legs[0].mode, "flight");
  const cheap = C.path("tashkent", "khiva", { pref: "cheapest" });
  assert.ok(cheap.price < fast.price, "the cheapest way costs less than the fastest");
  const comfort = C.path("tashkent", "khiva", { pref: "comfort" });
  assert.ok(!comfort.legs.some((l) => l.mode === "train" && l.hours > 8), "comfort avoids the 14-hour train");
});

test("Muynak is reached by flying to Nukus and driving on", () => {
  const r = C.path("tashkent", "muynak");
  assert.deepEqual(r.legs.map((l) => l.mode), ["flight", "car"]);
  assert.equal(r.legs[0].to, "nukus");
});

test("car prices grow with the group: sedan, then minivan", () => {
  const link = { mode: "car", hours: 3, price: 100 };
  const two = C.legPrice(link, { adults: 2, children: 0 });
  const five = C.legPrice(link, { adults: 5, children: 0 });
  assert.equal(two, 100 * D.PRICES.carKm);
  assert.equal(five, 100 * D.PRICES.carKm * D.PRICES.van);
  assert.equal(C.legPrice(link, { adults: 2, children: 0 }, true), 0, "a private driver covers transfers");
});

test("the classic tour: 7 nights, 8 days, legs and price parts add up", () => {
  const p = C.plan(C.tourTrip(D.tour("classic"), { month: 5 }));
  assert.equal(p.nights, 7);
  assert.equal(p.dayCount, 8);
  assert.deepEqual(p.legs.map((l) => l.to), ["samarkand", "bukhara", "khiva", "tashkent"]);
  const x = p.price;
  assert.equal(x.total, x.hotels + x.transport + x.driver + x.guide + x.fees + x.meals - x.discount);
  assert.ok(x.total > 0 && x.perPerson === x.total / 2);
});

test("sights are spread over the days and leftovers are reported", () => {
  const long = C.plan({ stops: [{ city: "samarkand", nights: 3 }], month: 5 });
  assert.ok(!long.warnings.some((w) => w.type === "missed"));
  const short = C.plan({ stops: [{ city: "samarkand", nights: 1 }, { city: "bukhara", nights: 1 }, { city: "khiva", nights: 1 }], month: 5 });
  assert.ok(short.warnings.some((w) => w.type === "rushed" && w.city === "samarkand"));
  assert.ok(short.warnings.some((w) => w.type === "missed"));
});

test("season: hotels cost more in May than in January, and July in Khiva is hot", () => {
  const may = C.plan({ stops: [{ city: "bukhara", nights: 2 }], month: 5 }).price.hotels;
  const jan = C.plan({ stops: [{ city: "bukhara", nights: 2 }], month: 1 }).price.hotels;
  assert.ok(may > jan);
  assert.ok(C.plan({ stops: [{ city: "khiva", nights: 2 }], month: 7 }).warnings.some((w) => w.type === "heat"));
});

test("hotel classes: Muynak has only guesthouses, Nurata is a yurt camp", () => {
  assert.equal(C.classIn(D.city("muynak"), "five"), "guest");
  assert.equal(C.classIn(D.city("nurata"), "three"), "yurt");
  const p = C.plan({ stops: [{ city: "muynak", nights: 1 }], hotel: "five", month: 5 });
  assert.ok(p.warnings.some((w) => w.type === "classLimit"));
});

test("group discount from 6 travellers and child rules", () => {
  const big = C.plan({ stops: [{ city: "samarkand", nights: 2 }], adults: 6, month: 5 }).price;
  assert.equal(big.discountRate, 0.05);
  const kids = C.plan({ stops: [{ city: "samarkand", nights: 2 }], adults: 2, children: 2, month: 5 }).price;
  const adults = C.plan({ stops: [{ city: "samarkand", nights: 2 }], adults: 4, month: 5 }).price;
  assert.ok(kids.total < adults.total, "two children cost less than two more adults");
});

test("stops are cleaned: unknown cities dropped, repeats merged, nights clamped", () => {
  assert.deepEqual(C.cleanStops([{ city: "samarkand", nights: 2 }, { city: "samarkand", nights: 1 }, { city: "atlantis", nights: 3 }, { city: "khiva", nights: 40 }]),
    [{ city: "samarkand", nights: 3 }, { city: "khiva", nights: 14 }]);
});

test("the planner survives a trip through the address bar", () => {
  const t = C.cleanTrip({ stops: [{ city: "bukhara", nights: 2 }, { city: "khiva", nights: 1 }], adults: 3, children: 1, hotel: "four", guide: false, driver: true, pref: "comfort", ret: "", date: "2027-04-10" });
  const back = C.tripFromQuery("?" + C.tripToQuery(t));
  assert.deepEqual(back, t);
  assert.equal(back.month, 4, "the month comes from the date");
  assert.equal(C.tripFromQuery("?add=nurata").stops[0].city, "nurata");
});

test("destination search, filters and the address", () => {
  assert.deepEqual(C.filterCities({ ...C.FILTER_DEFAULTS, q: "Самарканд" }).map((c) => c.id), ["samarkand"]);
  assert.deepEqual(C.filterCities({ ...C.FILTER_DEFAULTS, q: "registan" }).map((c) => c.id), ["samarkand"]);
  assert.ok(C.filterCities({ ...C.FILTER_DEFAULTS, type: "mountains" }).every((c) => c.types.includes("mountains")));
  assert.ok(C.filterCities({ ...C.FILTER_DEFAULTS, maxHours: 2 }).every((c) => C.cityStats(c).hours <= 2));
  const f = { ...C.FILTER_DEFAULTS, region: "west", month: 10, sort: "near" };
  assert.deepEqual(C.fromQuery("?" + C.toQuery(f)), f);
});

test("form checks", () => {
  assert.equal(C.checkName("O'tkir Hoshimov"), "");
  assert.equal(C.checkName("Анна-Мария"), "");
  assert.equal(C.checkName("x"), "length");
  assert.equal(C.checkName("R2D2"), "letters");
  assert.equal(C.checkEmail("a@b.uz"), "");
  assert.equal(C.checkEmail("a@b"), "invalid");
  assert.equal(C.checkPhone("+998 90 123 45 67"), "");
  assert.equal(C.checkPhone("+998 90 123"), "uz");
  assert.equal(C.checkPhone("+49 30 1234567"), "");
  assert.equal(C.checkPhone("12345"), "invalid");
  assert.equal(C.checkStart("2026-11-24", "2026-11-23"), "soon");
  assert.equal(C.checkStart("2026-12-01", "2026-11-23"), "");
  assert.equal(C.checkStart("2028-01-01", "2026-11-23"), "far");
  assert.match(C.bookingCode("x"), /^UZ-[A-Z2-9]{6}$/);
});
