# Find a Park

_Draft — to be hand-edited._

A small web app that helps residents find a local park. Pick a park from the list or the map to see its address, description, hours, size, rating, amenities, and photos. Built as a time-boxed (2-hour) exercise: a working, accessible core over extra features.

- Works without the map: the list is the primary way to browse.
- Keyboard and screen-reader friendly, targeting WCAG 2.2 AA on the main tasks.
- Works on phone and desktop.
- No user geolocation, no backend, no API keys (OpenStreetMap tiles).

## Running it

Requires Node 22.12+ or 24+ (Vitest 5's supported range; Vite 8 also accepts 20.19+). Developed on Node 23.7, which works but is outside Vitest's official range.

```sh
npm install
npm run dev      # start the dev server
npm test         # run tests in watch mode (npx vitest run for a single pass)
npm run build    # typecheck and build for production
npm run lint     # oxlint
```

## Stack

Vite + React + TypeScript, react-leaflet with OpenStreetMap tiles, Vitest + Testing Library (jsdom). No state libraries, UI kits, or backend — selection is a single `useState` in `App`.

## Project structure

```
public/images/              placeholder park photos (public domain)
src/assets/parks.sample.json  raw, messy source data
src/types.ts                the normalized Park type
src/normalizePark.ts        normalizePark (one record) and normalizeParks (list: drops unusable and duplicate records)
src/App.tsx                 loads + normalizes data once, holds the selection, lays out the page
src/components/ParkList.tsx     list of park buttons
src/components/ParkMap.tsx      Leaflet map with one named marker per located park
src/components/ParkDetails.tsx  selected park's details; receives focus on selection
src/components/ParkPhotos.tsx   selected park's photos
src/index.css               all styles
```

## Tests

- `src/normalizePark.test.ts` — normalization of messy records, a park with every field missing, id-less and duplicate parks (including the warnings logged), invalid coordinates, and the real sample file.
- `src/App.test.tsx` — selecting from the list and from a marker (mouse, Enter, Space) shows details and moves focus to the heading; selecting a park without coordinates shows the map note and clears the marker highlight.
- `src/components/ParkDetails.test.tsx` — selects every sample park and checks the page never shows "undefined", "null", or "NaN"; a sparse park renders only what it has.

- In addition to unit testing, manual testing was performed in-browser using Chrome, testing both Desktop and Mobile viewports at different sizes.
- An acknowledged gap in manual testing is the lack of testing in other browsers.

## Decisions and possible improvements

### Data and normalization

- Parks with no `id` are not displayed. A generated fallback id (e.g. from list index) could change between loads and orphan any data persisted against it.
- Parks with no name are shown as "Unnamed park", unless they also have no address and no coordinates — then there is no way to find them, so they are dropped.
- Addresses are shown exactly as given (some are full addresses, some just a street or intersection). Validating or completing addresses is out of scope, and adding a city/state would be inventing data.
- Hours are shown as given ("Dawn to dusk", "24 hours", time ranges, including one that runs past midnight). They are not parsed; that would only be needed for an "open now" feature.
- If two parks share an `id`, only the first is kept.
- Dropped records are logged with `console.warn`: a missing id logs the park's name, and a duplicate id logs the id plus the kept and dropped names. Accepted gap: parks dropped for having no name, address, or coordinates are not logged.
- `rating` and `acreage` are kept but only when they are valid numbers (rating 0–5, acreage ≥ 0).
- Cedar Hill Nature Preserve's coordinates (40.7128, -74.006) are the common "default NYC" point at City Hall and may be a placeholder in the source data. Left as-is.

### Images

- Placeholder images are public domain. Some parks were deliberately left with empty or invalid image entries to exercise normalization.
- Basic validation for valid image formats is performed.
- Alt text is not in the data. It is derived as "{park name}, photo {n} of {total}" — not descriptive, but accurate and not invented. Improvement: add real alt text to the source schema.

### Amenities

- Amenity slugs (`dog-run`) are turned into labels ("Dog run"), with a small override map for cases like `wifi` → "Wi-Fi".
- Improvement: a more thorough label mapping for known cases where punctuation or capitalization changes how the label reads.

### List and details

- The list is a `<ul>` of real `<button>`s; the selected park is marked with `aria-pressed`. Parks without coordinates show "No map location" in both the list and the details.
- Selecting a park — including re-selecting the same one — moves focus to the details heading (`<h2 tabIndex={-1}>`).
- Sections with no data (description, hours, amenities, photos, etc.) are omitted entirely rather than shown empty.
- If an image passes normalization but fails to load at runtime, it is removed rather than shown broken.
- A responsive layout is used for different screen sizes. 

### Map

- OpenStreetMap tiles via react-leaflet, with the required attribution. No user geolocation.
- The map fits to all parks that have coordinates; parks without coordinates are simply not on the map (the list still shows them).
- Selecting a park without coordinates shows "{name} has no map location. Showing all parks." above the map, clears any marker highlight, and zooms back out to the all-parks view, so the map never implies the previous park's location. The note is plain text, not a live region — focus already moves to the details heading, which says "No map location", so a live region would announce it twice.
- Each marker is named after its park (`alt` and `title`), is keyboard-focusable, and selecting it behaves exactly like selecting from the list — details update and focus moves to the details heading.
- The selected marker uses a recolored icon and is raised above others; the map pans to it (without animation if the user prefers reduced motion). Color alone does not convey selection — the details heading and the list's pressed state do.
- Scroll-wheel zoom is off so scrolling the page doesn't get trapped by the map. Improvement: on phones, one-finger drag still pans the map; a "two fingers to move" pattern would help.
- Leaflet's default marker icon paths break under Vite, so the icon images are imported explicitly.

### Accessibility (WCAG 2.2 AA pass)

- Leaflet gives marker icons `role="button"` and a tab stop, but they are `<img>` elements, so browsers don't activate them from the keyboard. Markers now select on Enter and Space (covered by a test).
- The focusable map container is named ("Park map. Arrow keys pan, plus and minus keys zoom.").
- Zoom, fade, and pan animations are off when the user prefers reduced motion.
- Contrast checked: body text 17.4:1, secondary text ≥ 7.4:1 on every background, borders and focus ring ≥ 4.5:1 (3:1 required).
- List buttons are at least 44px tall; markers (25×41) and zoom buttons (30×30) meet the 24px target minimum.
- Lighthouse scored accessibility 96, flagging only that markers can be close together. Accepted: WCAG 2.5.8's "equivalent" exception applies because every marker's action is also available from its list button, and the map can be zoomed to spread markers out.
- Headings: `h1` page title, `h2` for Parks / Map / the selected park, `h3` for Amenities. Photos have no heading; each image's alt text names the park.
- Improvement: there is no skip link past the map's tab stops (container, zoom buttons, ~12 markers, attribution links). Selecting a park jumps focus past them, and the headings/regions provide navigation, but a "Skip map" link would help keyboard users moving from the list back and forth.
- Improvement: markers don't expose a selected state to screen readers; the details heading receiving focus is the current signal.


### Future enhancements
- Ability to filter parks by operating hours, amenities, etc.
- Mobile focus: on phones, selecting a park jumps the page down to the details heading (below the list and map) while the map pans at the same time, which feels abrupt. Consider placement changes or a smoother scroll that respects reduced motion.
- Mobile map: one-finger drag pans the map instead of scrolling the page; a "use two fingers to move the map" pattern would help.
- Short viewports: the 12-button list and the details text can still make the page scroll on desktop.
- "Skip map" link past the map's ~16 tab stops.
- Expose the selected marker's state to screen readers.
- Real alt text in the source schema instead of derived "{name}, photo n of m".
- A fuller amenity label mapping for slugs where punctuation or capitalization changes the meaning.
- Log parks dropped for having no name, address, or coordinates (currently an accepted gap).

### AI assistance
- Cursor was used for this take home assignment using Claude Opus 5.5.  My environment has a "factory" plugin that I couldn't disable.  I prompted the agent instructing it not to use that plugin, and after scanning 
the transcript can find no reference to the plugin other than the creation of the .factory folder, which is autogenerated but contains nothing that was used.  The full transcript of 