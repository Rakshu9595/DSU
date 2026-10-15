# VisionTwin frontend

## Run locally

Serve this directory over HTTP (for example, open `index.html` with the VS Code Live Server extension). ES modules and browser storage do not work reliably when pages are opened directly with a `file://` URL.

## Libraries

The prototype loads Bootstrap 5.3.3, Bootstrap Icons, Chart.js 4.4.3, Three.js 0.164.1, and the DM Sans/Manrope fonts from public CDNs. An internet connection is required for those assets. Three.js is loaded as an ES module with an import map on `digital-twin.html`.

## Demo and backend mode

The default mode is `demo`. Sample projects, devices, analysis results, recommendations, and energy assumptions are labeled as demo or estimates. Demo project and preference edits are stored in the current browser only. The upload UI validates and previews local files but does not upload or analyze them. Demo CSV export contains sample data; PDF generation, authentication, uploads, and scene persistence require a backend.

The API client is configured in `js/config/app-config.js`. JSON and ordinary requests use Fetch; video uploads use an XMLHttpRequest adapter only to expose actual byte progress and cancellation. Before connecting a backend, define its endpoint contract there and in the service modules. For a local live-mode test, set these browser storage values before loading the app:

```js
localStorage.setItem("visiontwin-mode", "live");
localStorage.setItem("visiontwin-api-url", "http://localhost:3000/api");
```

Live requests include credentials for cookie-based sessions. No access token is stored by this frontend. The endpoint names in the configuration are defaults for integration planning, not claims about an existing server API.
