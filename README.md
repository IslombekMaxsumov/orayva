# ORAYVA: trips around Uzbekistan

Site #8 of my 10-websites course project: a travel agency for trips around Uzbekistan, in Uzbek, Russian and English, with prices in so'm or US dollars. Plain HTML, CSS and JavaScript: no framework, no build step, no backend. Everything you save stays in your browser.

The rule for this site: the tools must do real work, not just "click this, click that".

## Pages
| Page | What it does |
|---|---|
| `index.html` | Start a trip (pick places, month and travellers, with a live preview), places that are good this month, ready-made tours, how it works, recently viewed |
| `destinations.html` | 12 destinations: search (also sights and other spellings: "Регистан", "Samarqand"), region, good month, travel time from Tashkent, trip type, 4 sort orders. The filters are saved in the address |
| `destination.html?id=samarkand` | Description, key facts, a 12-month "when to go" strip, the sights, the fastest / cheapest / most comfortable way from Tashkent, tours that go there, add to my trip, save |
| `planner.html` | The trip planner (see below). The plan is kept in the address, so it can be shared |
| `booking.html` | A booking request for the planned trip: checked name, e-mail, phone and start date, an error summary that links to each field, a summary that re-prices itself for the chosen date, a booking code and a calendar file |
| `trips.html` | Booking requests (cancel with undo), saved plans (delete with undo), saved places, recently viewed |

## How the maths works (`js/calc.js`)
- **Routes:** the cities and their train, plane and car links form a graph; Dijkstra's shortest path finds the best way between any two places. "Fastest" counts about an hour for every change of transport and two more for a flight (airports), "cheapest" counts so'm, "most comfortable" avoids car rides over 4 hours and night trains.
- **Day by day:** each stop's nights become days; a travel day loses one sight slot for every 2.5 hours on the road; sights fill the free slots in order and anything left over becomes a warning.
- **Price:** hotel rooms (two adults a room, one child shares a bed, more children get an extra bed) × the city's price level × the season, or a per-person yurt camp in the desert; train and plane tickets per person (children half price); car transfers per km, a minivan from 4 travellers; or a private driver per day; a guide per day; entrance tickets; meals; a group discount from 6 travellers.
- **Warnings:** journeys of 7 hours or more, stays shorter than the minimum, sights that do not fit, hot or snowy months, and hotel classes a town does not have.

## Data
12 destinations with 3–4 sights each, 26 transport links and 10 tours in `js/data.js`. **Travel times are close to the real ones; prices are approximate demo figures.**

## Design (ORAYVA brief, 2026-11-23)
- **Colours, "Electric Lapis" (second colour brief, 2026-11-23):** the first palette (beige paper, navy, brick red) felt flat and too close to Varaq and OLIVE. Now: cool porcelain #F3F5FC, ink #182044, **lapis #263FC7** as the identity (main actions, the hero column, active nav, the route line, the planner total), **turquoise #006B66** as the second voice (metadata, route markers, itinerary details, the footer), **pomegranate #C21F4B** only for emphasis (logo O, labels, start and end markers), **atlas amber #F4C66A** for warmth and very hot months, and sand #F0E5D5 behind the sights. Dark mode is its own aubergine-charcoal (#17151D / #25212D / #34303E, warm #40332F, text #F5F0E8) with luminous accents (lapis #A9B8FF, turquoise #65D8C4, pomegranate #FF829B, amber #F4C66A). Every text pair passes WCAG AA. One change from the brief: on the turquoise footer the logo O and link hover are amber, because pomegranate on #006B66 is only 1.09:1.
- **Type:** Manrope for headings, Inter for text, IBM Plex Mono for prices, times and numbers.
- **Logo:** the ORAYVA wordmark (Manrope ExtraBold, open tracking) with a custom O whose counter is a pointed arch, like a madrasa portal seen straight on (`tools/logo.cjs` → `assets/brand`, `js/logo.js`). The arch O alone is the favicon.
- **Hero:** a magazine spread. On desktop the headline sits in a lapis column and the photograph of the Kalta Minor in Khiva bleeds to the right edge, so nothing covers the minaret; on phones the photo is on top and the words below it. The trip starter rises over the bottom of the hero.
- **Signature, the route line:** cities as stations on one lapis line, with turquoise stops and pomegranate start and end stops, on tour rows, the planner list of places and the day-by-day timeline.
- **Layout:** open and editorial. A magazine spread for "good this month", a gallery with a wide feature every six places, tours as rows, numbered sights, three ways to get there side by side, numbered sections in the planner. Surfaces only for the trip starter, the planner total and the booking summary.

## Photos
28 photos from Wikimedia Commons (1 to 3 per place, plus the hero), picked by eye for one look: one clear landmark, daylight and a blue sky where possible. All CC0, CC BY, CC BY-SA or public domain; the author and licence are shown with each photo. `node tools/commons.mjs` downloads and resizes them (Windows PowerShell) and writes `js/photos.js`. The paintings of the Savitsky Museum were left out because they may still be in copyright.

## Tests
`node --test tests/calc.test.mjs`: 13 tests for routes, car prices, the day-by-day plan, seasons, hotel classes, discounts, the address, search and the form checks.

## Files
- `js/logo.js` and `js/photos.js` are written by the tools; `js/data.js` places, links, prices and tours; `js/calc.js` all the maths; `js/store.js` saved data; `js/layout.js` header, footer, cards and form parts; `js/pages/*.js` one file per page; `js/lang.js` UZ / RU / EN text; `js/core.js` language, theme, storage, toasts.
- `tools/pages.mjs` writes the 6 HTML pages from one template.

The Russian and Uzbek text should be checked by a native speaker.
