/* Everything the visitor saves, kept in localStorage (Core.store): saved
   destinations, the trip being planned (the draft), saved plans, bookings,
   recently viewed places and the currency.
   Store.onChange(fn) runs fn after every change (also from other tabs). */
(function () {
  "use strict";
  const S = Core.store;
  const listeners = [];
  const changed = () => listeners.forEach((fn) => fn());
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- saved destinations ---------- */
  const saved = () => S.getJSON("saved", []).filter((id) => DATA.city(id));
  const isSaved = (id) => saved().includes(id);
  function toggleSaved(id) {
    const now = saved();
    const on = !now.includes(id);
    S.setJSON("saved", on ? [id, ...now] : now.filter((x) => x !== id));
    changed();
    return on;
  }

  /* ---------- the trip in the planner ---------- */
  const draft = () => { const d = S.getJSON("draft", null); return d ? Calc.cleanTrip(d) : null; };
  function setDraft(trip, quiet) { S.setJSON("draft", Calc.cleanTrip(trip)); if (!quiet) changed(); }
  // "add to my trip" from a destination page
  function addToDraft(cityId) {
    const d = draft() || Calc.cleanTrip({ stops: [] });
    d.stops.push({ city: cityId, nights: DATA.city(cityId).minNights });
    setDraft(d);
    return draft();
  }

  /* ---------- saved plans ---------- */
  const plans = () => S.getJSON("plans", []);
  function savePlan(name, trip) {
    const p = { id: uid(), name: String(name).slice(0, 60), trip: Calc.cleanTrip(trip), created: Date.now() };
    S.setJSON("plans", [p, ...plans()].slice(0, 20));
    changed();
    return p;
  }
  function removePlan(id) {
    const before = plans();
    S.setJSON("plans", before.filter((p) => p.id !== id));
    changed();
    return () => { S.setJSON("plans", before); changed(); };
  }

  /* ---------- bookings ---------- */
  const bookings = () => S.getJSON("bookings", []);
  function addBooking(b) {
    const code = Calc.bookingCode(JSON.stringify(b) + Date.now());
    const full = { ...b, code, status: "requested", created: Date.now() };
    S.setJSON("bookings", [full, ...bookings()]);
    changed();
    return full;
  }
  function cancelBooking(code) {
    const before = bookings();
    S.setJSON("bookings", before.map((b) => (b.code === code ? { ...b, status: "cancelled" } : b)));
    changed();
    return () => { S.setJSON("bookings", before); changed(); };
  }

  /* ---------- recently viewed ---------- */
  const recent = () => S.getJSON("recent", []).filter((id) => DATA.city(id));
  function addRecent(id) { S.setJSON("recent", [id, ...recent().filter((x) => x !== id)].slice(0, 6)); }

  /* ---------- currency ---------- */
  const currency = () => (S.get("currency", "uzs") === "usd" ? "usd" : "uzs");
  function setCurrency(c) { S.set("currency", c === "usd" ? "usd" : "uzs"); changed(); }

  function onChange(fn) { listeners.push(fn); }
  window.addEventListener("storage", (e) => { if (e.key && e.key.startsWith((window.APP_NS || "app") + ":")) changed(); });

  window.Store = { saved, isSaved, toggleSaved, draft, setDraft, addToDraft, plans, savePlan, removePlan, bookings, addBooking, cancelBooking, recent, addRecent, currency, setCurrency, onChange };
})();
