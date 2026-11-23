# Sayohat: trips around Uzbekistan (working name)

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

## Not done yet
- **The look:** the layout is final, but the colours and fonts are a neutral placeholder until the design brief (`../travel-design-prompt.md`).
- **Photos:** places show a plain plate with the region and name for now.

## Tests
`node --test tests/calc.test.mjs`: 13 tests for routes, car prices, the day-by-day plan, seasons, hotel classes, discounts, the address, search and the form checks.

## Files
- `js/data.js` places, links, prices and tours; `js/calc.js` all the maths; `js/store.js` saved data; `js/layout.js` header, footer, cards and form parts; `js/pages/*.js` one file per page; `js/lang.js` UZ / RU / EN text; `js/core.js` language, theme, storage, toasts.
- `tools/pages.mjs` writes the 6 HTML pages from one template.

The Russian and Uzbek text should be checked by a native speaker.
